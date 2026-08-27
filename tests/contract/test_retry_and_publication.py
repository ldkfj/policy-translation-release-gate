"""Tests for retry cooldown/attempts, publication guards, atomic active canonical checks, and objections."""

import json
import hashlib
import pytest
import genlayer.gl as gl
from genlayer import Address, u32, u64
from conftest import set_caller, set_time


def test_retry_unresolved_cooldown_boundaries_and_max_attempts(
    contract_factory, admin_address, localizer_address, web_mock, prompt_mock, setup_nondet, sample_canonical_doc, sample_translation_doc
):
    owner = "acme-corp"
    repo = "privacy-policy"
    base_time = 1700000000
    contract = contract_factory(owner=owner, repo=repo, timestamp=base_time)

    c_digest = hashlib.sha256(sample_canonical_doc.encode("utf-8")).hexdigest()
    t_digest = hashlib.sha256(sample_translation_doc.encode("utf-8")).hexdigest()

    set_caller(admin_address, timestamp=base_time + 10)
    c1 = contract.register_canonical("n1", "1" * 40, "terms.md", c_digest)
    contract.activate_canonical(u32(c1))

    set_caller(localizer_address, timestamp=base_time + 20)
    t1 = contract.register_translation("n2", u32(c1), "es", "2" * 40, "terms_es.md", t_digest)
    contract.freeze_translation(u32(t1))

    # 1. First assessment at timestamp T0 = base_time + 100 fails due to 503 -> HOLD_UNRESOLVED
    assess_time_1 = base_time + 100
    set_caller(localizer_address, timestamp=assess_time_1)
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'1'*40}", status=200, body=json.dumps({"sha": "1" * 40}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{'1'*40}/terms.md", status=200, body=sample_canonical_doc.encode("utf-8"))
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'2'*40}", status=503, body=b"Service Unavailable")

    contract.assess_translation(u32(t1))
    cand1 = contract.get_translation_candidate(u32(t1))
    assert cand1["state"] == "HOLD_UNRESOLVED"
    assert cand1["attempts"] == 1
    assert cand1["last_assessed_at"] == assess_time_1

    # 2. Cooldown boundary tests (cooldown is 600s):
    # Early retry at 599 seconds (assess_time_1 + 599) must be rejected with RETRY_COOLDOWN_ACTIVE
    set_caller(localizer_address, timestamp=assess_time_1 + 599)
    with pytest.raises(gl.vm.UserError) as exc_early:
        contract.retry_unresolved(u32(t1))
    assert "RETRY_COOLDOWN_ACTIVE" in str(exc_early.value)

    # Rejection leaves attempts and last_assessed_at completely unmutated
    cand_unmutated = contract.get_translation_candidate(u32(t1))
    assert cand_unmutated["attempts"] == 1
    assert cand_unmutated["state"] == "HOLD_UNRESOLVED"
    assert cand_unmutated["last_assessed_at"] == assess_time_1

    # 3. Retry at exactly 600 seconds (assess_time_1 + 600) is ALLOWED
    retry_time_2 = assess_time_1 + 600
    set_caller(localizer_address, timestamp=retry_time_2)
    # Still 503 to keep candidate in HOLD_UNRESOLVED for attempt 2
    contract.retry_unresolved(u32(t1))
    cand2 = contract.get_translation_candidate(u32(t1))
    assert cand2["state"] == "HOLD_UNRESOLVED"
    assert cand2["attempts"] == 2
    assert cand2["last_assessed_at"] == retry_time_2

    # 4. Retry at 601 seconds after 2nd attempt (retry_time_2 + 601) is ALLOWED
    retry_time_3 = retry_time_2 + 601
    set_caller(localizer_address, timestamp=retry_time_3)
    # Still 503 to reach attempt 3
    contract.retry_unresolved(u32(t1))
    cand3 = contract.get_translation_candidate(u32(t1))
    assert cand3["state"] == "HOLD_UNRESOLVED"
    assert cand3["attempts"] == 3
    assert cand3["last_assessed_at"] == retry_time_3

    # 5. 4th attempt exceeds max 3 attempts -> MAX_RETRY_ATTEMPTS_EXCEEDED
    retry_time_4 = retry_time_3 + 700
    set_caller(localizer_address, timestamp=retry_time_4)
    with pytest.raises(gl.vm.UserError) as exc_max:
        contract.retry_unresolved(u32(t1))
    assert "MAX_RETRY_ATTEMPTS_EXCEEDED" in str(exc_max.value)


def test_retry_unresolved_recovery_to_accepted(
    contract_factory, admin_address, localizer_address, web_mock, prompt_mock, setup_nondet, sample_canonical_doc, sample_translation_doc
):
    owner = "acme-corp"
    repo = "privacy-policy"
    base_time = 1700000000
    contract = contract_factory(owner=owner, repo=repo, timestamp=base_time)

    c_digest = hashlib.sha256(sample_canonical_doc.encode("utf-8")).hexdigest()
    t_digest = hashlib.sha256(sample_translation_doc.encode("utf-8")).hexdigest()

    set_caller(admin_address, timestamp=base_time + 10)
    c1 = contract.register_canonical("n1", "1" * 40, "terms.md", c_digest)
    contract.activate_canonical(u32(c1))

    set_caller(localizer_address, timestamp=base_time + 20)
    t1 = contract.register_translation("n2", u32(c1), "es", "2" * 40, "terms_es.md", t_digest)
    contract.freeze_translation(u32(t1))

    # 1. 1st attempt fails due to 503
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'1'*40}", status=200, body=json.dumps({"sha": "1" * 40}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{'1'*40}/terms.md", status=200, body=sample_canonical_doc.encode("utf-8"))
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'2'*40}", status=503, body=b"Service Unavailable")

    set_caller(localizer_address, timestamp=base_time + 100)
    contract.assess_translation(u32(t1))
    assert contract.get_translation_candidate(u32(t1))["state"] == "HOLD_UNRESOLVED"

    # 2. Service recovers, retry at T0 + 605s succeeds and accepts candidate
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'2'*40}", status=200, body=json.dumps({"sha": "2" * 40}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{'2'*40}/terms_es.md", status=200, body=sample_translation_doc.encode("utf-8"))

    recovery_time = base_time + 100 + 605
    set_caller(localizer_address, timestamp=recovery_time)
    contract.retry_unresolved(u32(t1))

    cand_recovered = contract.get_translation_candidate(u32(t1))
    assert cand_recovered["state"] == "ACCEPTED"
    assert cand_recovered["attempts"] == 2
    assert cand_recovered["last_assessed_at"] == recovery_time


def test_publication_guards_and_atomic_active_canonical_check(
    contract_factory, admin_address, localizer_address, web_mock, prompt_mock, setup_nondet, sample_canonical_doc, sample_translation_doc
):
    owner = "acme-corp"
    repo = "privacy-policy"
    contract = contract_factory(owner=owner, repo=repo)
    set_caller(admin_address)

    c_digest = hashlib.sha256(sample_canonical_doc.encode("utf-8")).hexdigest()
    t_digest = hashlib.sha256(sample_translation_doc.encode("utf-8")).hexdigest()

    c1 = contract.register_canonical("n1", "1" * 40, "terms.md", c_digest)
    contract.activate_canonical(u32(c1))

    set_caller(localizer_address)
    t1 = contract.register_translation("n2", u32(c1), "es", "2" * 40, "terms_es.md", t_digest)

    # Cannot publish draft candidate
    set_caller(admin_address)
    with pytest.raises(gl.vm.UserError) as exc1:
        contract.publish_translation(u32(t1))
    assert "CANDIDATE_NOT_ACCEPTED" in str(exc1.value)

    # Assess and accept candidate
    set_caller(localizer_address)
    contract.freeze_translation(u32(t1))
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'1'*40}", status=200, body=json.dumps({"sha": "1" * 40}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{'1'*40}/terms.md", status=200, body=sample_canonical_doc.encode("utf-8"))
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'2'*40}", status=200, body=json.dumps({"sha": "2" * 40}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{'2'*40}/terms_es.md", status=200, body=sample_translation_doc.encode("utf-8"))
    contract.assess_translation(u32(t1))
    assert contract.get_translation_candidate(u32(t1))["state"] == "ACCEPTED"

    # Unauthorized caller cannot publish
    set_caller(localizer_address)
    with pytest.raises(gl.vm.UserError) as exc2:
        contract.publish_translation(u32(t1))
    assert "UNAUTHORIZED_PUBLISHER" in str(exc2.value)

    # Admin publishes successfully
    set_caller(admin_address)
    contract.publish_translation(u32(t1))
    assert contract.get_translation_candidate(u32(t1))["state"] == "PUBLISHED"

    # Superseding c1 invalidates ability to publish on old canonical
    c2 = contract.register_canonical("n3", "3" * 40, "terms_v2.md", c_digest)
    contract.activate_canonical(u32(c2))

    # Old candidate on c1 is now STALE_BY_CANONICAL_REVISION
    assert contract.get_translation_candidate(u32(t1))["state"] == "STALE_BY_CANONICAL_REVISION"


def test_objections_pre_publish_allowed_and_post_publish_rejected(
    contract_factory, admin_address, localizer_address, observer_address, web_mock, prompt_mock, setup_nondet, sample_canonical_doc, sample_translation_doc
):
    owner = "acme-corp"
    repo = "privacy-policy"
    base_time = 1700000000
    contract = contract_factory(owner=owner, repo=repo, timestamp=base_time)
    set_caller(admin_address, timestamp=base_time + 10)

    c_digest = hashlib.sha256(sample_canonical_doc.encode("utf-8")).hexdigest()
    t_digest = hashlib.sha256(sample_translation_doc.encode("utf-8")).hexdigest()

    c1 = contract.register_canonical("n1", "1" * 40, "terms.md", c_digest)
    contract.activate_canonical(u32(c1))

    set_caller(localizer_address, timestamp=base_time + 20)
    t1 = contract.register_translation("n2", u32(c1), "es", "2" * 40, "terms_es.md", t_digest)

    # 1. Pre-publish objection on DRAFT candidate is ALLOWED
    set_caller(observer_address, timestamp=base_time + 30)
    obj1 = contract.record_objection(u32(t1), "1" * 64, "Draft notes ambiguity.")
    assert obj1 == 1

    # Freeze & assess
    set_caller(localizer_address, timestamp=base_time + 40)
    contract.freeze_translation(u32(t1))

    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'1'*40}", status=200, body=json.dumps({"sha": "1" * 40}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{'1'*40}/terms.md", status=200, body=sample_canonical_doc.encode("utf-8"))
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'2'*40}", status=200, body=json.dumps({"sha": "2" * 40}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{'2'*40}/terms_es.md", status=200, body=sample_translation_doc.encode("utf-8"))

    contract.assess_translation(u32(t1))
    assert contract.get_translation_candidate(u32(t1))["state"] == "ACCEPTED"

    # 2. Pre-publish objection on ACCEPTED candidate is ALLOWED
    set_caller(observer_address, timestamp=base_time + 50)
    obj2 = contract.record_objection(u32(t1), "2" * 64, "Accepted notes concern.")
    assert obj2 == 2

    # Objections page shows recorded objections
    page = contract.get_objections_page(u32(t1), u32(0), u32(10))
    assert len(page["items"]) == 2
    assert page["items"][0]["observer"].lower() == observer_address.as_hex.lower()
    assert page["items"][0]["created_at"] == base_time + 30
    assert page["items"][1]["created_at"] == base_time + 50

    # 3. Objection does NOT veto publication: admin can still publish ACCEPTED translation
    set_caller(admin_address, timestamp=base_time + 60)
    contract.publish_translation(u32(t1))
    assert contract.get_translation_candidate(u32(t1))["state"] == "PUBLISHED"

    # 4. Post-publish objection on PUBLISHED candidate is REJECTED
    set_caller(observer_address, timestamp=base_time + 70)
    with pytest.raises(gl.vm.UserError) as exc_pub:
        contract.record_objection(u32(t1), "3" * 64, "Objection after publish.")
    assert "CANNOT_OBJECT_TO_PUBLISHED_TRANSLATION" in str(exc_pub.value)

    # 5. Post-stale objection on STALE candidate is REJECTED
    set_caller(admin_address, timestamp=base_time + 80)
    c2 = contract.register_canonical("n3", "3" * 40, "terms_v2.md", c_digest)
    contract.activate_canonical(u32(c2))
    assert contract.get_translation_candidate(u32(t1))["state"] == "STALE_BY_CANONICAL_REVISION"

    set_caller(observer_address, timestamp=base_time + 90)
    with pytest.raises(gl.vm.UserError) as exc_stale:
        contract.record_objection(u32(t1), "4" * 64, "Objection after stale.")
    assert "CANNOT_OBJECT_TO_STALE_TRANSLATION" in str(exc_stale.value)

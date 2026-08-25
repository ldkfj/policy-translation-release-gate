"""Tests for evidence boundary URL construction, source-status classification taxonomy, and fail-safe outcomes."""

import json
import hashlib
import pytest
import genlayer.gl as gl
from genlayer import Address, u32
from conftest import set_caller


def test_evidence_boundary_exact_url_construction(
    contract_factory, admin_address, localizer_address, web_mock, prompt_mock, setup_nondet, sample_canonical_doc, sample_translation_doc
):
    owner = "secure-org"
    repo = "compliance-docs"
    contract = contract_factory(owner=owner, repo=repo)
    set_caller(admin_address)

    c_commit = "1" * 40
    c_path = "policies/privacy.md"
    c_digest = hashlib.sha256(sample_canonical_doc.encode("utf-8")).hexdigest()
    c1 = contract.register_canonical("n-c1", c_commit, c_path, c_digest)
    contract.activate_canonical(u32(c1))

    set_caller(localizer_address)
    t_commit = "2" * 40
    t_path = "policies/privacy_es.md"
    t_digest = hashlib.sha256(sample_translation_doc.encode("utf-8")).hexdigest()
    t1 = contract.register_translation("n-t1", u32(c1), "es", t_commit, t_path, t_digest)
    contract.freeze_translation(u32(t1))

    # Register mock responses
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{c_commit}", status=200, body=json.dumps({"sha": c_commit}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{c_commit}/{c_path}", status=200, body=sample_canonical_doc.encode("utf-8"))
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{t_commit}", status=200, body=json.dumps({"sha": t_commit}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{t_commit}/{t_path}", status=200, body=sample_translation_doc.encode("utf-8"))

    contract.assess_translation(u32(t1))

    # Verify URLs constructed
    called_urls = [call["url"] for call in web_mock.calls]
    assert f"https://api.github.com/repos/{owner}/{repo}/commits/{c_commit}" in called_urls
    assert f"https://raw.githubusercontent.com/{owner}/{repo}/{c_commit}/{c_path}" in called_urls
    assert f"https://api.github.com/repos/{owner}/{repo}/commits/{t_commit}" in called_urls
    assert f"https://raw.githubusercontent.com/{owner}/{repo}/{t_commit}/{t_path}" in called_urls

    # Check candidate transitioned to ACCEPTED
    cand = contract.get_translation_candidate(u32(t1))
    assert cand["state"] == "ACCEPTED"
    assert cand["has_assessment"] is True


@pytest.mark.parametrize("status_code", [0, 429, 500, 503, 599])
def test_unavailable_evidence_yields_unresolved_without_false_denial(
    contract_factory, admin_address, localizer_address, web_mock, prompt_mock, setup_nondet, sample_canonical_doc, status_code
):
    owner = "acme"
    repo = "policy"
    contract = contract_factory(owner=owner, repo=repo)
    set_caller(admin_address)

    c_commit = "a" * 40
    c_path = "terms.md"
    c_digest = hashlib.sha256(sample_canonical_doc.encode("utf-8")).hexdigest()
    c1 = contract.register_canonical("n1", c_commit, c_path, c_digest)
    contract.activate_canonical(u32(c1))

    set_caller(localizer_address)
    t_commit = "b" * 40
    t_path = "terms_es.md"
    t_digest = "0" * 64
    t1 = contract.register_translation("n2", u32(c1), "es", t_commit, t_path, t_digest)
    contract.freeze_translation(u32(t1))

    # Canonical is available, translation commit API returns unavailable status code
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{c_commit}", status=200, body=json.dumps({"sha": c_commit}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{c_commit}/{c_path}", status=200, body=sample_canonical_doc.encode("utf-8"))
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{t_commit}", status=status_code, body=b"Service Error")

    contract.assess_translation(u32(t1))

    cand = contract.get_translation_candidate(u32(t1))
    assert cand["state"] == "HOLD_UNRESOLVED"

    assessment = contract.get_assessment(u32(t1))
    assert assessment["outcome"] == "UNRESOLVED"
    assert assessment["translation_status"] == "UNAVAILABLE"
    # No substantive obligation/scope drift conclusions
    assert assessment["coverage_bps"] == 0
    assert len(assessment["changed_dimensions"]) == 0


def test_missing_file_yields_not_comparable(
    contract_factory, admin_address, localizer_address, web_mock, prompt_mock, setup_nondet, sample_canonical_doc
):
    owner = "acme"
    repo = "policy"
    contract = contract_factory(owner=owner, repo=repo)
    set_caller(admin_address)

    c_commit = "a" * 40
    c_path = "terms.md"
    c_digest = hashlib.sha256(sample_canonical_doc.encode("utf-8")).hexdigest()
    c1 = contract.register_canonical("n1", c_commit, c_path, c_digest)
    contract.activate_canonical(u32(c1))

    set_caller(localizer_address)
    t_commit = "b" * 40
    t_path = "terms_es.md"
    t_digest = "0" * 64
    t1 = contract.register_translation("n2", u32(c1), "es", t_commit, t_path, t_digest)
    contract.freeze_translation(u32(t1))

    # Commit API succeeds, but raw translation file returns 404 MISSING
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{c_commit}", status=200, body=json.dumps({"sha": c_commit}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{c_commit}/{c_path}", status=200, body=sample_canonical_doc.encode("utf-8"))
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{t_commit}", status=200, body=json.dumps({"sha": t_commit}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{t_commit}/{t_path}", status=404, body=b"404 Not Found")

    contract.assess_translation(u32(t1))

    cand = contract.get_translation_candidate(u32(t1))
    assert cand["state"] == "REVISION_REQUIRED"

    assessment = contract.get_assessment(u32(t1))
    assert assessment["outcome"] == "NOT_COMPARABLE"
    assert assessment["translation_status"] == "MISSING"


def test_invalid_provenance_digest_utf8_oversize(
    contract_factory, admin_address, localizer_address, web_mock, prompt_mock, setup_nondet, sample_canonical_doc
):
    owner = "acme"
    repo = "policy"
    contract = contract_factory(owner=owner, repo=repo)
    set_caller(admin_address)

    c_commit = "a" * 40
    c_path = "terms.md"
    c_digest = hashlib.sha256(sample_canonical_doc.encode("utf-8")).hexdigest()
    c1 = contract.register_canonical("n1", c_commit, c_path, c_digest)
    contract.activate_canonical(u32(c1))

    # 1. Commit SHA mismatch in API response
    set_caller(localizer_address)
    t1 = contract.register_translation("n-t1", u32(c1), "es", "b" * 40, "es.md", "0" * 64)
    contract.freeze_translation(u32(t1))

    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{c_commit}", status=200, body=json.dumps({"sha": c_commit}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{c_commit}/{c_path}", status=200, body=sample_canonical_doc.encode("utf-8"))
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'b'*40}", status=200, body=json.dumps({"sha": "c" * 40}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{'b'*40}/es.md", status=200, body=b"content")

    contract.assess_translation(u32(t1))
    cand1 = contract.get_translation_candidate(u32(t1))
    assert cand1["state"] == "REVISION_REQUIRED"
    assert contract.get_assessment(u32(t1))["translation_status"] == "INVALID"

    # 2. SHA-256 digest mismatch on file
    t2 = contract.register_translation("n-t2", u32(c1), "fr", "d" * 40, "fr.md", "e" * 64)
    contract.freeze_translation(u32(t2))

    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'d'*40}", status=200, body=json.dumps({"sha": "d" * 40}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{'d'*40}/fr.md", status=200, body=b"[[SECTION:s1]]\nActual different content")

    contract.assess_translation(u32(t2))
    assert contract.get_translation_candidate(u32(t2))["state"] == "REVISION_REQUIRED"
    assert contract.get_assessment(u32(t2))["translation_status"] == "INVALID"

    # 3. Malformed UTF-8
    t3 = contract.register_translation("n-t3", u32(c1), "de", "f" * 40, "de.md", hashlib.sha256(b"\xff\xfe\xfd").hexdigest())
    contract.freeze_translation(u32(t3))

    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'f'*40}", status=200, body=json.dumps({"sha": "f" * 40}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{'f'*40}/de.md", status=200, body=b"\xff\xfe\xfd")

    contract.assess_translation(u32(t3))
    assert contract.get_translation_candidate(u32(t3))["state"] == "REVISION_REQUIRED"
    assert contract.get_assessment(u32(t3))["translation_status"] == "INVALID"

    # 4. Oversized document (> 20,000 characters)
    oversized_doc = ("[[SECTION:s1]]\n" + "x" * 20050).encode("utf-8")
    t4 = contract.register_translation("n-t4", u32(c1), "es", "9" * 40, "it.md", hashlib.sha256(oversized_doc).hexdigest())
    contract.freeze_translation(u32(t4))

    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'9'*40}", status=200, body=json.dumps({"sha": "9" * 40}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{'9'*40}/it.md", status=200, body=oversized_doc)

    contract.assess_translation(u32(t4))
    assert contract.get_translation_candidate(u32(t4))["state"] == "REVISION_REQUIRED"
    assert contract.get_assessment(u32(t4))["translation_status"] == "INVALID"

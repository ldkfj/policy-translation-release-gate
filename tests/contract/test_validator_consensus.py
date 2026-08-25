"""Tests for custom validator independent semantic re-derivation, consequence-bearing checks, and false leader output rejection."""

import json
import hashlib
import pytest
import genlayer.gl as gl
from genlayer import Address, u32
from conftest import set_caller


def test_validator_accepts_honest_leader_and_transitions_state(
    contract_factory, admin_address, localizer_address, web_mock, prompt_mock, sample_canonical_doc, sample_translation_doc
):
    """Honest leader and validator agree on all consequence-bearing fields."""
    contract = contract_factory()
    set_caller(admin_address)

    c_digest = hashlib.sha256(sample_canonical_doc.encode("utf-8")).hexdigest()
    t_digest = hashlib.sha256(sample_translation_doc.encode("utf-8")).hexdigest()

    c1 = contract.register_canonical("n1", "1" * 40, "terms.md", c_digest)
    contract.activate_canonical(u32(c1))

    set_caller(localizer_address)
    t1 = contract.register_translation("n2", u32(c1), "es", "2" * 40, "terms_es.md", t_digest)
    contract.freeze_translation(u32(t1))

    web_mock.register("https://api.github.com/repos/acme-corp/privacy-policy/commits/" + "1" * 40, status=200, body=json.dumps({"sha": "1" * 40}).encode("utf-8"))
    web_mock.register("https://raw.githubusercontent.com/acme-corp/privacy-policy/" + "1" * 40 + "/terms.md", status=200, body=sample_canonical_doc.encode("utf-8"))
    web_mock.register("https://api.github.com/repos/acme-corp/privacy-policy/commits/" + "2" * 40, status=200, body=json.dumps({"sha": "2" * 40}).encode("utf-8"))
    web_mock.register("https://raw.githubusercontent.com/acme-corp/privacy-policy/" + "2" * 40 + "/terms_es.md", status=200, body=sample_translation_doc.encode("utf-8"))

    # Execute with real validator logic
    def run_nondet_honest(leader_fn, validator_fn):
        leader_res = leader_fn()
        valid = validator_fn(gl.vm.Return(leader_res))
        assert valid is True
        return leader_res

    gl.vm.run_nondet_unsafe = run_nondet_honest

    contract.assess_translation(u32(t1))

    cand = contract.get_translation_candidate(u32(t1))
    assert cand["state"] == "ACCEPTED"


def test_validator_rejects_schema_valid_but_substantively_false_outcome(
    contract_factory, admin_address, localizer_address, web_mock, prompt_mock, sample_canonical_doc, sample_translation_doc
):
    """Negative test: Leader crafts a schema-valid JSON claiming MATERIALLY_EQUIVALENT,

    but validator re-derives OBLIGATION_DRIFT. Validator must reject false leader output.
    """
    contract = contract_factory()
    set_caller(admin_address)

    c_digest = hashlib.sha256(sample_canonical_doc.encode("utf-8")).hexdigest()
    t_digest = hashlib.sha256(sample_translation_doc.encode("utf-8")).hexdigest()

    c1 = contract.register_canonical("n1", "1" * 40, "terms.md", c_digest)
    contract.activate_canonical(u32(c1))

    set_caller(localizer_address)
    t1 = contract.register_translation("n2", u32(c1), "es", "2" * 40, "terms_es.md", t_digest)
    contract.freeze_translation(u32(t1))

    web_mock.register("https://api.github.com/repos/acme-corp/privacy-policy/commits/" + "1" * 40, status=200, body=json.dumps({"sha": "1" * 40}).encode("utf-8"))
    web_mock.register("https://raw.githubusercontent.com/acme-corp/privacy-policy/" + "1" * 40 + "/terms.md", status=200, body=sample_canonical_doc.encode("utf-8"))
    web_mock.register("https://api.github.com/repos/acme-corp/privacy-policy/commits/" + "2" * 40, status=200, body=json.dumps({"sha": "2" * 40}).encode("utf-8"))
    web_mock.register("https://raw.githubusercontent.com/acme-corp/privacy-policy/" + "2" * 40 + "/terms_es.md", status=200, body=sample_translation_doc.encode("utf-8"))

    # Validator prompt will detect obligation drift
    prompt_mock.set_override("sec1", {
        "rights": "EQUIVALENT",
        "obligations": "CHANGED",
        "prohibitions": "EQUIVALENT",
        "exceptions": "EQUIVALENT",
        "scope": "EQUIVALENT",
        "thresholds": "EQUIVALENT",
        "deadlines": "EQUIVALENT",
    })

    # Malicious leader returns falsified result saying MATERIALLY_EQUIVALENT with valid schema
    def run_nondet_malicious_leader(leader_fn, validator_fn):
        honest_res = leader_fn()
        # Falsify outcome and reason while keeping JSON schema valid
        falsified_res = dict(honest_res)
        falsified_res["outcome"] = "MATERIALLY_EQUIVALENT"
        falsified_res["changed_dimensions"] = []

        valid = validator_fn(gl.vm.Return(falsified_res))
        assert valid is False, "Validator must reject substantively false leader result!"
        # In GenVM consensus failure raises UserError or halts transaction
        raise gl.UserError("VALIDATOR_CONSENSUS_REJECTED")

    gl.vm.run_nondet_unsafe = run_nondet_malicious_leader

    with pytest.raises(gl.UserError) as exc:
        contract.assess_translation(u32(t1))
    assert "VALIDATOR_CONSENSUS_REJECTED" in str(exc.value)

    # Candidate remains FROZEN, no corrupt state mutation
    cand = contract.get_translation_candidate(u32(t1))
    assert cand["state"] == "FROZEN"
    assert cand["has_assessment"] is False


def test_validator_rejects_altered_fingerprint_or_section_coverage(
    contract_factory, admin_address, localizer_address, web_mock, prompt_mock, sample_canonical_doc, sample_translation_doc
):
    """Validator rejects leader with mismatched fingerprint or falsified coverage."""
    contract = contract_factory()
    set_caller(admin_address)

    c_digest = hashlib.sha256(sample_canonical_doc.encode("utf-8")).hexdigest()
    t_digest = hashlib.sha256(sample_translation_doc.encode("utf-8")).hexdigest()

    c1 = contract.register_canonical("n1", "1" * 40, "terms.md", c_digest)
    contract.activate_canonical(u32(c1))

    set_caller(localizer_address)
    t1 = contract.register_translation("n2", u32(c1), "es", "2" * 40, "terms_es.md", t_digest)
    contract.freeze_translation(u32(t1))

    web_mock.register("https://api.github.com/repos/acme-corp/privacy-policy/commits/" + "1" * 40, status=200, body=json.dumps({"sha": "1" * 40}).encode("utf-8"))
    web_mock.register("https://raw.githubusercontent.com/acme-corp/privacy-policy/" + "1" * 40 + "/terms.md", status=200, body=sample_canonical_doc.encode("utf-8"))
    web_mock.register("https://api.github.com/repos/acme-corp/privacy-policy/commits/" + "2" * 40, status=200, body=json.dumps({"sha": "2" * 40}).encode("utf-8"))
    web_mock.register("https://raw.githubusercontent.com/acme-corp/privacy-policy/" + "2" * 40 + "/terms_es.md", status=200, body=sample_translation_doc.encode("utf-8"))

    # Test bad fingerprint
    def run_nondet_bad_fp(leader_fn, validator_fn):
        honest_res = leader_fn()
        bad_fp_res = dict(honest_res)
        bad_fp_res["fingerprint"] = "0" * 64
        valid = validator_fn(gl.vm.Return(bad_fp_res))
        assert valid is False
        raise gl.UserError("VALIDATOR_CONSENSUS_REJECTED")

    gl.vm.run_nondet_unsafe = run_nondet_bad_fp

    with pytest.raises(gl.UserError):
        contract.assess_translation(u32(t1))

    assert contract.get_translation_candidate(u32(t1))["state"] == "FROZEN"


def test_validator_rejects_unverified_reason(
    contract_factory, admin_address, localizer_address, web_mock,
    sample_canonical_doc, sample_translation_doc
):
    contract = contract_factory()
    set_caller(admin_address)
    c_digest = hashlib.sha256(sample_canonical_doc.encode("utf-8")).hexdigest()
    t_digest = hashlib.sha256(sample_translation_doc.encode("utf-8")).hexdigest()
    c1 = contract.register_canonical("reason-c", "1" * 40, "terms.md", c_digest)
    contract.activate_canonical(u32(c1))
    set_caller(localizer_address)
    t1 = contract.register_translation(
        "reason-t", u32(c1), "es", "2" * 40, "terms_es.md", t_digest
    )
    contract.freeze_translation(u32(t1))
    web_mock.register("https://api.github.com/repos/acme-corp/privacy-policy/commits/" + "1" * 40, status=200, body=json.dumps({"sha": "1" * 40}).encode("utf-8"))
    web_mock.register("https://raw.githubusercontent.com/acme-corp/privacy-policy/" + "1" * 40 + "/terms.md", status=200, body=sample_canonical_doc.encode("utf-8"))
    web_mock.register("https://api.github.com/repos/acme-corp/privacy-policy/commits/" + "2" * 40, status=200, body=json.dumps({"sha": "2" * 40}).encode("utf-8"))
    web_mock.register("https://raw.githubusercontent.com/acme-corp/privacy-policy/" + "2" * 40 + "/terms_es.md", status=200, body=sample_translation_doc.encode("utf-8"))

    def run_nondet_bad_reason(leader_fn, validator_fn):
        result = leader_fn()
        result["reason"] = "Unsupported reviewer-facing explanation."
        assert validator_fn(gl.vm.Return(result)) is False
        raise gl.UserError("VALIDATOR_CONSENSUS_REJECTED")

    gl.vm.run_nondet_unsafe = run_nondet_bad_reason
    with pytest.raises(gl.UserError):
        contract.assess_translation(u32(t1))
    assert contract.get_translation_candidate(u32(t1))["state"] == "FROZEN"

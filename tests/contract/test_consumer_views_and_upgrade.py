"""Tests for consumer namespace binding, effective locale lookup, views, and Root Slot upgradability with bytes ABI."""

import json
import hashlib
import pytest
import genlayer.gl as gl
from genlayer import Address, u32
from genlayer.py.storage import Root
from conftest import set_caller


def test_consumer_binding_and_effective_locale_lifecycle(
    contract_factory, admin_address, localizer_address, consumer_address, web_mock, prompt_mock, setup_nondet, sample_canonical_doc, sample_translation_doc
):
    owner = "org-corp"
    repo = "terms-repo"
    base_time = 1700000000
    contract = contract_factory(owner=owner, repo=repo, timestamp=base_time)
    set_caller(admin_address, timestamp=base_time + 10)

    c_digest = hashlib.sha256(sample_canonical_doc.encode("utf-8")).hexdigest()
    t_digest = hashlib.sha256(sample_translation_doc.encode("utf-8")).hexdigest()

    c1 = contract.register_canonical("n1", "1" * 40, "terms.md", c_digest)
    contract.activate_canonical(u32(c1))

    set_caller(localizer_address, timestamp=base_time + 20)
    t1 = contract.register_translation("n2", u32(c1), "es", "2" * 40, "terms_es.md", t_digest)
    contract.freeze_translation(u32(t1))

    # Assessment and Publication
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'1'*40}", status=200, body=json.dumps({"sha": "1" * 40}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{'1'*40}/terms.md", status=200, body=sample_canonical_doc.encode("utf-8"))
    web_mock.register(f"https://api.github.com/repos/{owner}/{repo}/commits/{'2'*40}", status=200, body=json.dumps({"sha": "2" * 40}).encode("utf-8"))
    web_mock.register(f"https://raw.githubusercontent.com/{owner}/{repo}/{'2'*40}/terms_es.md", status=200, body=sample_translation_doc.encode("utf-8"))

    contract.assess_translation(u32(t1))

    # Before publication: effective locale lookup returns not published
    eff_before = contract.get_effective_locale("es")
    assert eff_before["is_effective"] is False

    set_caller(consumer_address, timestamp=base_time + 25)
    with pytest.raises(gl.vm.UserError, match="CANDIDATE_NOT_PUBLISHED"):
        contract.bind_consumer("web-app", "es", u32(t1))

    # Publish
    set_caller(admin_address, timestamp=base_time + 30)
    contract.publish_translation(u32(t1))

    # After publication: effective locale returns candidate details
    eff_after = contract.get_effective_locale("es")
    assert eff_after["is_effective"] is True
    assert eff_after["candidate_id"] == t1
    assert eff_after["canonical_id"] == c1
    assert eff_after["locale"] == "es"

    # Consumer binds to namespace at T_bind
    bind_time = base_time + 40
    set_caller(consumer_address, timestamp=bind_time)
    contract.bind_consumer("web-app", "es", u32(t1))

    binding = contract.get_consumer_binding("web-app", "es")
    assert binding["exists"] is True
    assert binding["is_effective"] is True
    assert binding["candidate_id"] == t1
    assert binding["candidate_state"] == "PUBLISHED"
    assert binding["bound_at"] == bind_time

    # Only the original namespace owner or publisher admin may update a binding.
    set_caller(Address("0x5555555555555555555555555555555555555555"), timestamp=bind_time + 1)
    with pytest.raises(gl.vm.UserError, match="UNAUTHORIZED_BINDING_OWNER"):
        contract.bind_consumer("web-app", "es", u32(t1))

    set_caller(consumer_address, timestamp=bind_time + 2)
    contract.bind_consumer("web-app", "es", u32(t1))

    # Canonical supersession invalidates effective locale and consumer binding
    set_caller(admin_address, timestamp=base_time + 50)
    c2 = contract.register_canonical("n3", "3" * 40, "terms_v2.md", c_digest)
    contract.activate_canonical(u32(c2))

    eff_stale = contract.get_effective_locale("es")
    assert eff_stale["is_effective"] is False

    binding_stale = contract.get_consumer_binding("web-app", "es")
    assert binding_stale["exists"] is True
    assert binding_stale["is_effective"] is False


def test_nonce_result_and_events_views(contract_factory, admin_address):
    base_time = 1700000000
    contract = contract_factory(timestamp=base_time)
    set_caller(admin_address, timestamp=base_time + 10)

    c1 = contract.register_canonical("nonce-can-1", "a" * 40, "terms.md", "b" * 64)

    nonce_info = contract.get_nonce_result("nonce-can-1")
    assert nonce_info["exists"] is True
    assert nonce_info["entity_type"] == "canonical"
    assert nonce_info["id"] == c1

    nonce_absent = contract.get_nonce_result("nonce-nonexistent")
    assert nonce_absent["exists"] is False

    # Events page
    events = contract.get_events_page(u32(0), u32(10))
    assert events["total"] >= 2
    assert len(events["items"]) >= 2
    assert events["items"][0]["event_type"] == "INITIALIZE_PUBLISHER"
    assert events["items"][0]["timestamp"] == base_time
    assert events["items"][1]["event_type"] == "REGISTER_CANONICAL"
    assert events["items"][1]["timestamp"] == base_time + 10


def test_upgradability_bytes_abi_and_root_slot_pattern(contract_factory, admin_address, localizer_address):
    contract = contract_factory()

    # Verify upgrader view matches admin
    upgrader = contract.get_upgrader()
    assert upgrader.as_hex.lower() == admin_address.as_hex.lower()

    # Authorized admin upgrades with exact bytes (including trailing newline)
    set_caller(admin_address)
    new_bytecode = b"# GenLayer Intelligent Contract Bytecode v2.0.0\nprint('upgraded')\n"
    contract.upgrade(new_bytecode)

    # Verify Root Slot code was updated with exact bytes
    root = Root.get()
    code_vla = root.code.get()
    stored_bytes = bytes(code_vla)
    assert stored_bytes == new_bytecode
    assert stored_bytes.decode("utf-8") == "# GenLayer Intelligent Contract Bytecode v2.0.0\nprint('upgraded')\n"

    # Storage is preserved across upgrade
    profile = contract.get_publisher_profile()
    assert profile["owner"] == "acme-corp"
    assert profile["repo"] == "privacy-policy"
    assert profile["admin"].lower() == admin_address.as_hex.lower()
    assert profile["initialized"] is True

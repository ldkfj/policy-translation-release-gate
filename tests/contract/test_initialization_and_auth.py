"""Tests for contract initialization, repository immutability, role authorization, and validation rules."""

import pytest
import genlayer.gl as gl
from genlayer import Address, u32
from genlayer.py.storage import inmem_allocate
from conftest import set_caller
from contracts.policy_translation_release_gate import (
    PolicyTranslationReleaseGate,
    _is_safe_owner_repo,
    _is_safe_sha,
    _is_safe_digest,
    _is_safe_path,
    _is_safe_locale,
    _is_safe_namespace,
    _is_safe_nonce,
)


def test_constructor_zero_params_and_clean_state(admin_address):
    set_caller(admin_address, timestamp=1700000000)
    contract = inmem_allocate(PolicyTranslationReleaseGate)

    profile = contract.get_publisher_profile()
    assert profile["owner"] == ""
    assert profile["repo"] == ""
    assert profile["admin"].lower() == admin_address.as_hex.lower()
    assert profile["initialized"] is False
    assert profile["policy_version"] == 1
    assert profile["active_canonical_id"] == 0
    assert profile["canonical_count"] == 0
    assert profile["candidate_count"] == 0
    assert profile["objection_count"] == 0
    assert profile["event_count"] == 0


def test_initialization_via_write_method(admin_address, localizer_address):
    set_caller(admin_address, timestamp=1700000100)
    contract = inmem_allocate(PolicyTranslationReleaseGate)
    assert contract.initialized is False

    # Unauthorized caller cannot initialize
    set_caller(localizer_address, timestamp=1700000101)
    with pytest.raises(gl.UserError) as exc:
        contract.initialize_publisher("org-beta", "rules-repo")
    assert "UNAUTHORIZED_CALLER" in str(exc.value)

    # Admin initializes successfully
    set_caller(admin_address, timestamp=1700000102)
    contract.initialize_publisher("org-beta", "rules-repo")
    assert contract.initialized is True
    assert contract.owner == "org-beta"
    assert contract.repo == "rules-repo"

    # Profile shows initialized status
    profile = contract.get_publisher_profile()
    assert profile["initialized"] is True
    assert profile["owner"] == "org-beta"
    assert profile["repo"] == "rules-repo"
    assert profile["event_count"] == 1

    # Event timestamp matches transaction timestamp
    events = contract.get_events_page(u32(0), u32(10))
    assert events["total"] == 1
    assert events["items"][0]["event_type"] == "INITIALIZE_PUBLISHER"
    assert events["items"][0]["timestamp"] == 1700000102

    # Double initialization is rejected
    with pytest.raises(gl.UserError) as exc2:
        contract.initialize_publisher("org-gamma", "other-repo")
    assert "PUBLISHER_ALREADY_INITIALIZED" in str(exc2.value)


def test_missing_or_invalid_transaction_datetime_fails_closed(
    admin_address
):
    set_caller(admin_address, timestamp=1700000200)
    contract = inmem_allocate(PolicyTranslationReleaseGate)
    original = gl.message_raw
    try:
        gl.message_raw = {"sender_address": admin_address}
        with pytest.raises(gl.UserError) as missing:
            contract.initialize_publisher("acme-corp", "privacy-policy")
        assert "INVALID_TRANSACTION_DATETIME" in str(missing.value)

        set_caller(admin_address, timestamp=1700000200)
        contract = inmem_allocate(PolicyTranslationReleaseGate)
        gl.message_raw = {"sender_address": admin_address, "datetime": "not-a-time"}
        with pytest.raises(gl.UserError) as invalid:
            contract.initialize_publisher("acme-corp", "privacy-policy")
        assert "INVALID_TRANSACTION_DATETIME" in str(invalid.value)
    finally:
        gl.message_raw = original


@pytest.mark.parametrize(
    "owner,repo",
    [
        ("-invalid-owner", "valid-repo"),
        ("invalid-owner-", "valid-repo"),
        ("invalid_owner", "valid-repo"),
        ("invalid owner", "valid-repo"),
        ("a" * 40, "valid-repo"),
        ("", "valid-repo"),
        ("valid-owner", "repo.git"),
        ("valid-owner", "."),
        ("valid-owner", ".."),
        ("valid-owner", "repo with spaces"),
        ("valid-owner", "a" * 101),
        ("valid-owner", ""),
    ],
)
def test_invalid_owner_repo_rejection(admin_address, owner, repo):
    set_caller(admin_address)
    assert not _is_safe_owner_repo(owner, repo)

    contract = inmem_allocate(PolicyTranslationReleaseGate)
    with pytest.raises(gl.UserError) as exc:
        contract.initialize_publisher(owner, repo)
    assert "INVALID_OWNER_OR_REPO" in str(exc.value)


def test_uninitialized_contract_rejects_writes(admin_address):
    set_caller(admin_address)
    contract = inmem_allocate(PolicyTranslationReleaseGate)

    with pytest.raises(gl.UserError) as exc:
        contract.register_canonical("n-1", "a" * 40, "docs/p.md", "b" * 64)
    assert "PUBLISHER_NOT_INITIALIZED" in str(exc.value)

    with pytest.raises(gl.UserError) as exc:
        contract.activate_canonical(u32(1))
    assert "PUBLISHER_NOT_INITIALIZED" in str(exc.value)

    with pytest.raises(gl.UserError) as exc:
        contract.register_translation("n-2", u32(1), "es", "a" * 40, "docs/es.md", "b" * 64)
    assert "PUBLISHER_NOT_INITIALIZED" in str(exc.value)

    with pytest.raises(gl.UserError) as exc:
        contract.publish_translation(u32(1))
    assert "PUBLISHER_NOT_INITIALIZED" in str(exc.value)


def test_pure_validation_helpers():
    assert _is_safe_sha("a" * 40) is True
    assert _is_safe_sha("A" * 40) is False
    assert _is_safe_sha("a" * 39) is False
    assert _is_safe_sha("a" * 41) is False
    assert _is_safe_sha("g" * 40) is False

    assert _is_safe_digest("0" * 64) is True
    assert _is_safe_digest("0" * 63) is False
    assert _is_safe_digest("0" * 65) is False
    assert _is_safe_digest("Z" * 64) is False

    assert _is_safe_path("docs/policy.md") is True
    assert _is_safe_path("policy.txt") is True
    assert _is_safe_path("a/b/c/d.md") is True
    assert _is_safe_path("../secret.txt") is False
    assert _is_safe_path("docs/../secret.txt") is False
    assert _is_safe_path("docs/./secret.txt") is False
    assert _is_safe_path("/docs/secret.txt") is False
    assert _is_safe_path("docs/secret.txt/") is False
    assert _is_safe_path("docs//secret.txt") is False
    assert _is_safe_path("docs\\secret.txt") is False
    assert _is_safe_path("docs/secret.txt?query=1") is False
    assert _is_safe_path("docs/secret.txt#fragment") is False
    assert _is_safe_path("https://example.com/file") is False

    assert _is_safe_locale("es") is True
    assert _is_safe_locale("fr-FR") is True
    assert _is_safe_locale("zh-CN") is True
    assert _is_safe_locale("pt-BR") is True
    assert _is_safe_locale("") is False
    assert _is_safe_locale("-es") is False
    assert _is_safe_locale("es-") is False

    assert _is_safe_namespace("web-app") is True
    assert _is_safe_namespace("app.v1_prod") is True
    assert _is_safe_namespace("") is False
    assert _is_safe_namespace("app name") is False

    assert _is_safe_nonce("nonce-1234") is True
    assert _is_safe_nonce("") is False

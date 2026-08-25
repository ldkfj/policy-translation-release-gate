"""Tests for canonical policy revisions lifecycle, activation, and atomic supersession."""

import pytest
import genlayer.gl as gl
from genlayer import Address, u32
from conftest import set_caller


def test_register_canonical_basic(contract_factory, admin_address, localizer_address):
    contract = contract_factory()

    # Unauthorized caller cannot register canonical
    set_caller(localizer_address)
    with pytest.raises(gl.UserError) as exc:
        contract.register_canonical(
            "nonce-c1",
            "a" * 40,
            "policies/terms.md",
            "b" * 64,
        )
    assert "UNAUTHORIZED_PUBLISHER" in str(exc.value)

    # Admin registers successfully
    set_caller(admin_address)
    c_id = contract.register_canonical(
        "nonce-c1",
        "a" * 40,
        "policies/terms.md",
        "b" * 64,
    )
    assert c_id == 1

    rev = contract.get_canonical_revision(u32(1))
    assert rev["id"] == 1
    assert rev["commit"] == "a" * 40
    assert rev["path"] == "policies/terms.md"
    assert rev["digest"] == "b" * 64
    assert rev["state"] == "REGISTERED"

    # Profile counts updated
    profile = contract.get_publisher_profile()
    assert profile["canonical_count"] == 1
    assert profile["active_canonical_id"] == 0


def test_register_canonical_nonce_idempotency_and_replay(contract_factory, admin_address):
    contract = contract_factory()
    set_caller(admin_address)

    # First registration
    c_id1 = contract.register_canonical(
        "nonce-c1",
        "a" * 40,
        "policies/terms.md",
        "b" * 64,
    )
    assert c_id1 == 1

    # Exact replay returns same ID without creating a new record
    c_id_replay = contract.register_canonical(
        "nonce-c1",
        "a" * 40,
        "policies/terms.md",
        "b" * 64,
    )
    assert c_id_replay == 1
    assert contract.canonical_count == 1

    # Replay with different payload is rejected
    with pytest.raises(gl.UserError) as exc:
        contract.register_canonical(
            "nonce-c1",
            "c" * 40,
            "policies/terms.md",
            "b" * 64,
        )
    assert "NONCE_REUSED_WITH_DIFFERENT_PAYLOAD" in str(exc.value)


def test_register_canonical_max_cap(contract_factory, admin_address):
    contract = contract_factory()
    set_caller(admin_address)

    # Register up to MAX_CANONICAL_REVISIONS (16)
    for i in range(1, 17):
        c_id = contract.register_canonical(
            f"nonce-c-{i}",
            f"{i:040x}",
            f"policies/terms_v{i}.md",
            f"{i:064x}",
        )
        assert c_id == i

    assert contract.canonical_count == 16

    # 17th registration exceeds cap
    with pytest.raises(gl.UserError) as exc:
        contract.register_canonical(
            "nonce-c-17",
            f"{17:040x}",
            "policies/terms_v17.md",
            f"{17:064x}",
        )
    assert "CANONICAL_CAP_EXCEEDED" in str(exc.value)


def test_activate_canonical_and_atomic_supersession(contract_factory, admin_address, localizer_address):
    contract = contract_factory()
    set_caller(admin_address)

    # Register two canonical revisions
    c1 = contract.register_canonical("n1", "1" * 40, "terms.md", "a" * 64)
    c2 = contract.register_canonical("n2", "2" * 40, "terms.md", "b" * 64)

    # Unauthorized activation rejected
    set_caller(localizer_address)
    with pytest.raises(gl.UserError) as exc:
        contract.activate_canonical(u32(c1))
    assert "UNAUTHORIZED_PUBLISHER" in str(exc.value)

    # Admin activates c1
    set_caller(admin_address)
    contract.activate_canonical(u32(c1))
    assert contract.get_active_canonical()["id"] == c1
    rev1 = contract.get_canonical_revision(u32(c1))
    assert rev1["state"] == "ACTIVE"

    # Activating c2 supersedes c1 atomically
    contract.activate_canonical(u32(c2))
    assert contract.get_active_canonical()["id"] == c2

    rev1_updated = contract.get_canonical_revision(u32(c1))
    assert rev1_updated["state"] == "SUPERSEDED"

    rev2 = contract.get_canonical_revision(u32(c2))
    assert rev2["state"] == "ACTIVE"

    # Re-activating already active c2 raises error
    with pytest.raises(gl.UserError) as exc2:
        contract.activate_canonical(u32(c2))
    assert "CANONICAL_ALREADY_ACTIVE" in str(exc2.value)

    # Activating nonexistent canonical raises error
    with pytest.raises(gl.UserError) as exc3:
        contract.activate_canonical(u32(99))
    assert "CANONICAL_NOT_FOUND" in str(exc3.value)


def test_canonical_pagination_and_views(contract_factory, admin_address):
    contract = contract_factory()
    set_caller(admin_address)

    for i in range(1, 6):
        contract.register_canonical(
            f"nonce-{i}",
            f"{i:040x}",
            f"docs/terms_{i}.md",
            f"{i:064x}",
        )

    # Offset 0, limit 2
    page1 = contract.get_canonical_revisions_page(u32(0), u32(2))
    assert len(page1["items"]) == 2
    assert page1["items"][0]["id"] == 1
    assert page1["items"][1]["id"] == 2
    assert page1["total"] == 5
    assert page1["offset"] == 0
    assert page1["limit"] == 2

    # Offset 4, limit 2 (1 item)
    page3 = contract.get_canonical_revisions_page(u32(4), u32(2))
    assert len(page3["items"]) == 1
    assert page3["items"][0]["id"] == 5

    # Out-of-bounds offset
    page4 = contract.get_canonical_revisions_page(u32(10), u32(2))
    assert len(page4["items"]) == 0
    assert page4["total"] == 5

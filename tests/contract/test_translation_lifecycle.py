"""Tests for translation candidate registration, draft updates, freeze immutability, and caps."""

import pytest
import genlayer.gl as gl
from genlayer import Address, u32
from conftest import set_caller


def test_register_translation_basic(contract_factory, admin_address, localizer_address):
    contract = contract_factory(timestamp=1700000200)
    set_caller(admin_address, timestamp=1700000201)
    c1 = contract.register_canonical("nonce-c1", "a" * 40, "terms.md", "1" * 64)

    # Localizer registers translation
    set_caller(localizer_address, timestamp=1700000202)
    cand_id = contract.register_translation(
        "nonce-t1",
        u32(c1),
        "es",
        "b" * 40,
        "terms_es.md",
        "2" * 64,
    )
    assert cand_id == 1

    cand = contract.get_translation_candidate(u32(1))
    assert cand["id"] == 1
    assert cand["canonical_id"] == c1
    assert cand["locale"] == "es"
    assert cand["localizer"].lower() == localizer_address.as_hex.lower()
    assert cand["commit"] == "b" * 40
    assert cand["path"] == "terms_es.md"
    assert cand["digest"] == "2" * 64
    assert cand["state"] == "DRAFT"
    assert cand["created_at"] == 1700000202


def test_register_translation_nonce_replay(contract_factory, admin_address, localizer_address):
    contract = contract_factory()
    set_caller(admin_address)
    c1 = contract.register_canonical("nonce-c1", "a" * 40, "terms.md", "1" * 64)

    set_caller(localizer_address)
    cand_id = contract.register_translation(
        "nonce-t1",
        u32(c1),
        "es",
        "b" * 40,
        "terms_es.md",
        "2" * 64,
    )
    assert cand_id == 1

    # Exact replay
    replay_id = contract.register_translation(
        "nonce-t1",
        u32(c1),
        "es",
        "b" * 40,
        "terms_es.md",
        "2" * 64,
    )
    assert replay_id == 1
    assert contract.candidate_count == 1

    # Different payload with same nonce is rejected
    with pytest.raises(gl.UserError) as exc:
        contract.register_translation(
            "nonce-t1",
            u32(c1),
            "fr",
            "c" * 40,
            "terms_fr.md",
            "3" * 64,
        )
    assert "NONCE_REUSED_WITH_DIFFERENT_PAYLOAD" in str(exc.value)


def test_duplicate_candidate_rejection(contract_factory, admin_address, localizer_address):
    contract = contract_factory()
    set_caller(admin_address)
    c1 = contract.register_canonical("nonce-c1", "a" * 40, "terms.md", "1" * 64)

    set_caller(localizer_address)
    contract.register_translation(
        "nonce-t1",
        u32(c1),
        "es",
        "b" * 40,
        "terms_es.md",
        "2" * 64,
    )

    # Re-registering exact duplicate (canonical_id, locale, commit, path) with new nonce
    with pytest.raises(gl.UserError) as exc:
        contract.register_translation(
            "nonce-t2",
            u32(c1),
            "es",
            "b" * 40,
            "terms_es.md",
            "9" * 64,
        )
    assert "DUPLICATE_CANDIDATE" in str(exc.value)


def test_max_locales_per_canonical_cap(contract_factory, admin_address, localizer_address):
    contract = contract_factory()
    set_caller(admin_address)
    c1 = contract.register_canonical("nonce-c1", "a" * 40, "terms.md", "1" * 64)

    set_caller(localizer_address)
    # Register 3 distinct locales (MAX_LOCALES_PER_CANONICAL = 3)
    locales = ["es", "fr", "de"]
    for i, loc in enumerate(locales, 1):
        contract.register_translation(
            f"nonce-t-{loc}",
            u32(c1),
            loc,
            f"{i:040x}",
            f"terms_{loc}.md",
            f"{i:064x}",
        )

    # 4th distinct locale on same canonical is rejected
    with pytest.raises(gl.UserError) as exc:
        contract.register_translation(
            "nonce-t-it",
            u32(c1),
            "it",
            "4" * 40,
            "terms_it.md",
            "4" * 64,
        )
    assert "MAX_LOCALES_CAP_EXCEEDED" in str(exc.value)

    # But another candidate for an existing locale is allowed (if different commit/path)
    c_es2 = contract.register_translation(
        "nonce-t-es2",
        u32(c1),
        "es",
        "5" * 40,
        "terms_es_v2.md",
        "5" * 64,
    )
    assert c_es2 == 4


def test_cannot_register_on_superseded_canonical(contract_factory, admin_address, localizer_address):
    contract = contract_factory()
    set_caller(admin_address)
    c1 = contract.register_canonical("n1", "1" * 40, "terms.md", "a" * 64)
    c2 = contract.register_canonical("n2", "2" * 40, "terms.md", "b" * 64)

    # Activate c1 then c2 (c1 becomes superseded)
    contract.activate_canonical(u32(c1))
    contract.activate_canonical(u32(c2))

    set_caller(localizer_address)
    with pytest.raises(gl.UserError) as exc:
        contract.register_translation(
            "nonce-t1",
            u32(c1),
            "es",
            "3" * 40,
            "terms_es.md",
            "c" * 64,
        )
    assert "CANNOT_REGISTER_ON_SUPERSEDED" in str(exc.value)


def test_update_translation_draft_and_strict_localizer_authorization(
    contract_factory, admin_address, localizer_address, observer_address
):
    contract = contract_factory()
    set_caller(admin_address)
    c1 = contract.register_canonical("n1", "1" * 40, "terms.md", "a" * 64)

    set_caller(localizer_address)
    t1 = contract.register_translation("n-t1", u32(c1), "es", "1" * 40, "terms_es.md", "1" * 64)

    # Unauthorized third party observer cannot update
    set_caller(observer_address)
    with pytest.raises(gl.UserError) as exc:
        contract.update_translation_draft(u32(t1), "2" * 40, "terms_es_v2.md", "2" * 64)
    assert "UNAUTHORIZED_LOCALIZER" in str(exc.value)

    # Publisher admin CANNOT update localizer's draft (strict localizer authorization)
    set_caller(admin_address)
    with pytest.raises(gl.UserError) as exc_admin:
        contract.update_translation_draft(u32(t1), "2" * 40, "terms_es_v2.md", "2" * 64)
    assert "UNAUTHORIZED_LOCALIZER" in str(exc_admin.value)

    # Publisher admin CANNOT freeze localizer's draft
    with pytest.raises(gl.UserError) as exc_freeze_admin:
        contract.freeze_translation(u32(t1))
    assert "UNAUTHORIZED_LOCALIZER" in str(exc_freeze_admin.value)

    # Exact localizer updates successfully
    set_caller(localizer_address)
    contract.update_translation_draft(u32(t1), "2" * 40, "terms_es_v2.md", "2" * 64)
    cand = contract.get_translation_candidate(u32(t1))
    assert cand["commit"] == "2" * 40
    assert cand["path"] == "terms_es_v2.md"
    assert cand["digest"] == "2" * 64

    # Exact localizer freezes successfully
    contract.freeze_translation(u32(t1))
    cand_frozen = contract.get_translation_candidate(u32(t1))
    assert cand_frozen["state"] == "FROZEN"


def test_freeze_translation_and_immutability(contract_factory, admin_address, localizer_address):
    contract = contract_factory()
    set_caller(admin_address)
    c1 = contract.register_canonical("n1", "1" * 40, "terms.md", "a" * 64)

    set_caller(localizer_address)
    t1 = contract.register_translation("n-t1", u32(c1), "es", "1" * 40, "terms_es.md", "1" * 64)

    # Freeze candidate
    contract.freeze_translation(u32(t1))
    cand = contract.get_translation_candidate(u32(t1))
    assert cand["state"] == "FROZEN"

    # Cannot update a frozen candidate
    with pytest.raises(gl.UserError) as exc:
        contract.update_translation_draft(u32(t1), "2" * 40, "terms_es_v2.md", "2" * 64)
    assert "CANDIDATE_NOT_IN_DRAFT" in str(exc.value)

    # Cannot freeze an already frozen candidate
    with pytest.raises(gl.UserError) as exc2:
        contract.freeze_translation(u32(t1))
    assert "CANDIDATE_NOT_IN_DRAFT" in str(exc2.value)


def test_candidate_pagination_and_views(contract_factory, admin_address, localizer_address):
    contract = contract_factory()
    set_caller(admin_address)
    c1 = contract.register_canonical("n1", "1" * 40, "terms.md", "a" * 64)

    set_caller(localizer_address)
    locales = ["es", "fr", "de"]
    for i, loc in enumerate(locales, 1):
        contract.register_translation(
            f"n-{loc}",
            u32(c1),
            loc,
            f"{i:040x}",
            f"terms_{loc}.md",
            f"{i:064x}",
        )

    # Page for canonical c1
    page = contract.get_translation_candidates_page(u32(0), u32(2), u32(c1))
    assert len(page["items"]) == 2
    assert page["items"][0]["id"] == 1
    assert page["items"][1]["id"] == 2
    assert page["total"] == 3
    assert page["offset"] == 0
    assert page["limit"] == 2

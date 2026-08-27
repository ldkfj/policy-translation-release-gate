"""Test configuration and shared fixtures for Policy Translation Release Gate."""

import os
import sys
import types
import json
import glob
import typing
import cloudpickle
import pytest

# Ensure GENERATING_DOCS is set to avoid reading fd 0 on import
os.environ["GENERATING_DOCS"] = "true"

# Mock _genlayer_wasi if not already present
if "_genlayer_wasi" not in sys.modules:
    _wasi_storage: dict[bytes, bytearray] = {}

    def _wasi_storage_write(slot_id: bytes, offset: int, buffer: typing.Any) -> None:
        if slot_id not in _wasi_storage:
            _wasi_storage[slot_id] = bytearray()
        buf = bytes(buffer)
        end = offset + len(buf)
        if len(_wasi_storage[slot_id]) < end:
            _wasi_storage[slot_id].extend(b"\x00" * (end - len(_wasi_storage[slot_id])))
        _wasi_storage[slot_id][offset:end] = buf

    def _wasi_storage_read(slot_id: bytes, offset: int, dest_bytearray: bytearray) -> None:
        if slot_id in _wasi_storage:
            data = _wasi_storage[slot_id]
            src = data[offset : offset + len(dest_bytearray)]
            dest_bytearray[: len(src)] = src
        else:
            dest_bytearray[:] = b"\x00" * len(dest_bytearray)

    wasi_mock = types.ModuleType("_genlayer_wasi")
    wasi_mock.storage_read = _wasi_storage_read
    wasi_mock.storage_write = _wasi_storage_write
    wasi_mock.get_balance = lambda *a: 0
    wasi_mock.get_self_balance = lambda *a: 0
    wasi_mock.gl_call = lambda *a: 0
    sys.modules["_genlayer_wasi"] = wasi_mock


def _resolve_sdk_path() -> str:
    """Dynamically resolves the GenLayer SDK path from E:/Genlayer-Tools toolchain."""
    env_path = os.environ.get("GENLAYER_SDK_PATH")
    if env_path and os.path.exists(env_path):
        return env_path

    candidates = [
        r"E:/Genlayer-Tools/GenVM/v0.3.0-rc7/extracted/v0.3.0-rc7/py-lib-genlayer-std/11rhn002yfajawsz7fai6mykznbxkxs6l91iskj5cm82c92qhy3v",
        r"E:/Genlayer-Tools/GenVM/v0.3.0-rc7/extracted/v0.3.0-rc7.tar/py-lib-genlayer-std/11rhn002yfajawsz7fai6mykznbxkxs6l91iskj5cm82c92qhy3v",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c

    matches = glob.glob(r"E:/Genlayer-Tools/**/py-lib-genlayer-std/**/genlayer", recursive=True)
    if matches:
        return os.path.dirname(matches[0])

    raise RuntimeError(
        "GenLayer SDK path could not be resolved from E:/Genlayer-Tools. "
        "Ensure E:/Genlayer-Tools/GenVM is present or set GENLAYER_SDK_PATH."
    )


sdk_path = _resolve_sdk_path()
if sdk_path not in sys.path:
    sys.path.insert(0, sdk_path)

project_root = r"E:/Genlayer-Projects/policy-translation-release-gate"
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import genlayer as genlayer_top
import genlayer.gl as gl
from genlayer import Address, u32, u64
from genlayer.py.storage import inmem_allocate, Root
from contracts.policy_translation_release_gate import PolicyTranslationReleaseGate

# Ensure UserError is accessible via gl.UserError and genlayer.UserError
gl.UserError = gl.vm.UserError
genlayer_top.UserError = gl.vm.UserError
if hasattr(genlayer_top, "gl"):
    genlayer_top.gl.UserError = gl.vm.UserError


def set_caller(address: Address, timestamp: int = 1700000000):
    msg = types.SimpleNamespace(
        contract_address=Address("0x0000000000000000000000000000000000000000"),
        sender_address=address,
        sender=address,
        origin_address=address,
        origin=address,
        value=0,
        chain_id=1,
    )
    gl.message = msg
    raw_msg = {
        "contract_address": Address("0x0000000000000000000000000000000000000000"),
        "sender_address": address,
        "origin_address": address,
        "value": 0,
        "chain_id": 1,
        "datetime": int(timestamp),
        "is_init": False,
        "entry_kind": 0,
        "entry_data": b"",
        "entry_stage_data": None,
        "stack": [],
    }
    gl.message_raw = raw_msg
    if hasattr(genlayer_top, "gl"):
        genlayer_top.gl.message = msg
        genlayer_top.gl.message_raw = raw_msg
    genlayer_top.message = msg
    genlayer_top.message_raw = raw_msg


def set_time(timestamp: int):
    if hasattr(gl, "message_raw") and isinstance(gl.message_raw, dict):
        gl.message_raw["datetime"] = int(timestamp)
    if hasattr(genlayer_top, "message_raw") and isinstance(genlayer_top.message_raw, dict):
        genlayer_top.message_raw["datetime"] = int(timestamp)


class WebMockRegistry:
    """Mock web client that records calls and dispatches configured responses."""

    def __init__(self):
        self.routes = {}
        self.calls = []

    def register(self, url: str, status: int = 200, body: bytes = b"", headers: dict = None):
        self.routes[url] = gl.nondet.web.Response(
            status=status,
            headers=headers or {},
            body=body,
        )

    def get(self, url: str, headers: dict = None):
        self.calls.append({"url": url, "headers": headers or {}})
        if url in self.routes:
            return self.routes[url]
        if "/commits/" in url:
            sha = url.split("/")[-1]
            return gl.nondet.web.Response(
                status=200,
                headers={},
                body=json.dumps({"sha": sha}).encode("utf-8"),
            )
        return gl.nondet.web.Response(status=404, headers={}, body=b"")


class PromptMockRegistry:
    """Mock LLM prompt executor that records prompts and returns configured outputs."""

    def __init__(self):
        self.default_dims = {
            "rights": "EQUIVALENT",
            "obligations": "EQUIVALENT",
            "prohibitions": "EQUIVALENT",
            "exceptions": "EQUIVALENT",
            "scope": "EQUIVALENT",
            "thresholds": "EQUIVALENT",
            "deadlines": "EQUIVALENT",
        }
        self.section_overrides = {}
        self.raw_override = None
        self.calls = []

    def set_override(self, section_id: str, dims: typing.Any):
        self.section_overrides[section_id] = dims

    def set_raw_override(self, val: typing.Any):
        self.raw_override = val

    def exec_prompt(self, prompt: str, response_format: str = "json", images=None):
        self.calls.append(prompt)
        if self.raw_override is not None:
            if callable(self.raw_override):
                return self.raw_override(prompt)
            return self.raw_override

        for sec_id, dims in self.section_overrides.items():
            if f"Section ID: {sec_id}" in prompt:
                if isinstance(dims, dict):
                    return dict(dims)
                return dims
        return dict(self.default_dims)


@pytest.fixture
def admin_address():
    return Address("0x1111111111111111111111111111111111111111")


@pytest.fixture
def localizer_address():
    return Address("0x2222222222222222222222222222222222222222")


@pytest.fixture
def observer_address():
    return Address("0x3333333333333333333333333333333333333333")


@pytest.fixture
def consumer_address():
    return Address("0x4444444444444444444444444444444444444444")


@pytest.fixture
def web_mock():
    mock = WebMockRegistry()
    gl.nondet.web.get = mock.get
    return mock


@pytest.fixture
def prompt_mock():
    mock = PromptMockRegistry()
    gl.nondet.exec_prompt = mock.exec_prompt
    return mock


@pytest.fixture
def setup_nondet():
    """Runs leader and validator through the production-shaped pickle boundary."""
    def mock_run_nondet_unsafe(leader_fn, validator_fn):
        serialized_leader = cloudpickle.dumps(leader_fn)
        serialized_validator = cloudpickle.dumps(validator_fn)
        leader_res = cloudpickle.loads(serialized_leader)()
        serialized_result = cloudpickle.dumps(leader_res)
        valid = cloudpickle.loads(serialized_validator)(
            gl.vm.Return(cloudpickle.loads(serialized_result))
        )
        if not valid:
            raise gl.UserError("VALIDATOR_DISAGREED")
        return leader_res

    gl.vm.run_nondet_unsafe = mock_run_nondet_unsafe
    return mock_run_nondet_unsafe


@pytest.fixture
def sample_canonical_doc():
    return (
        "[[SECTION:sec1]]\n"
        "Users have the right to request data deletion within 30 days.\n"
        "[[SECTION:sec2]]\n"
        "The service provider must encrypt all personal data at rest."
    )


@pytest.fixture
def sample_translation_doc():
    return (
        "[[SECTION:sec1]]\n"
        "Los usuarios tienen derecho a solicitar la eliminacion de datos en 30 dias.\n"
        "[[SECTION:sec2]]\n"
        "El proveedor de servicios debe cifrar todos los datos personales en reposo."
    )


@pytest.fixture
def contract_factory(admin_address):
    def _create(owner="acme-corp", repo="privacy-policy", timestamp=1700000000):
        set_caller(admin_address, timestamp=timestamp)
        contract = inmem_allocate(PolicyTranslationReleaseGate)
        if owner or repo:
            contract.initialize_publisher(owner, repo)
        return contract

    return _create

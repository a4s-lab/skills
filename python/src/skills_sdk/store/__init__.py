from __future__ import annotations

from typing import Protocol, runtime_checkable

from .fs import FS
from .memory import Memory


@runtime_checkable
class Store(Protocol):
    async def write(self, path: str, content: bytes) -> None: ...
    async def read(self, path: str) -> bytes: ...
    async def list(self, prefix: str) -> list[str]: ...
    async def exists(self, path: str) -> bool: ...
    async def delete(self, path: str) -> None: ...


__all__ = ["Store", "FS", "Memory"]

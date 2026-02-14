from __future__ import annotations

import os
import shutil


class FS:
    async def write(self, path: str, content: bytes) -> None:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(content)

    async def read(self, path: str) -> bytes:
        with open(path, "rb") as f:
            return f.read()

    async def list(self, prefix: str) -> list[str]:
        entries = []
        try:
            for entry in os.scandir(prefix):
                if entry.is_dir():
                    entries.append(entry.name)
        except FileNotFoundError:
            pass
        return sorted(entries)

    async def exists(self, path: str) -> bool:
        return os.path.exists(path)

    async def delete(self, path: str) -> None:
        if os.path.isfile(path):
            os.remove(path)
        else:
            shutil.rmtree(path, ignore_errors=True)

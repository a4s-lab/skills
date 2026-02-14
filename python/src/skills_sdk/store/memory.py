from __future__ import annotations


class Memory:
    def __init__(self) -> None:
        self._files: dict[str, bytes] = {}

    async def write(self, path: str, content: bytes) -> None:
        self._files[path] = content

    async def read(self, path: str) -> bytes:
        if path not in self._files:
            raise FileNotFoundError(f"No such file: {path}")
        return self._files[path]

    async def list(self, prefix: str) -> list[str]:
        normalized = prefix if prefix.endswith("/") else prefix + "/"
        dirs: set[str] = set()
        for key in self._files:
            if not key.startswith(normalized):
                continue
            rest = key[len(normalized) :]
            slash = rest.find("/")
            if slash != -1:
                dirs.add(rest[:slash])
        return sorted(dirs)

    async def exists(self, path: str) -> bool:
        if path in self._files:
            return True
        dir_prefix = path if path.endswith("/") else path + "/"
        return any(k.startswith(dir_prefix) for k in self._files)

    async def delete(self, path: str) -> None:
        dir_prefix = path if path.endswith("/") else path + "/"
        to_delete = [path] + [k for k in self._files if k.startswith(dir_prefix)]
        for key in to_delete:
            self._files.pop(key, None)

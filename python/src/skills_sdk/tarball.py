from __future__ import annotations

import io
import tarfile


def parse_tar_gz(data: bytes) -> dict[str, bytes]:
    files: dict[str, bytes] = {}
    strip_prefix = ""

    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tar:
        for member in tar.getmembers():
            if not member.isfile():
                continue

            path = member.name

            if not strip_prefix and "/" in path:
                strip_prefix = path[: path.index("/") + 1]

            if strip_prefix and path.startswith(strip_prefix):
                path = path[len(strip_prefix) :]

            if not path:
                continue

            f = tar.extractfile(member)
            if f is not None:
                files[path] = f.read()

    return files

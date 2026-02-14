from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class Metadata:
    name: str
    description: str
    license: str | None = None
    compatibility: str | None = None
    allowed_tools: list[str] | None = None
    metadata: dict[str, Any] | None = None

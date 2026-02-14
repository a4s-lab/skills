from __future__ import annotations

import frontmatter

from .errors import ParseError
from .types import Metadata


def parse_skill_md(content: str) -> tuple[Metadata, str]:
    post = frontmatter.loads(content)
    data = post.metadata

    if not isinstance(data.get("name"), str) or not data["name"]:
        raise ParseError('SKILL.md frontmatter must include a "name" field')
    if not isinstance(data.get("description"), str) or not data["description"]:
        raise ParseError('SKILL.md frontmatter must include a "description" field')

    metadata = Metadata(name=data["name"], description=data["description"])

    if data.get("license") is not None:
        metadata.license = str(data["license"])

    if data.get("compatibility") is not None:
        metadata.compatibility = str(data["compatibility"])

    tools = data.get("allowed-tools")
    if tools is None:
        tools = data.get("allowedTools")
    if tools is not None:
        if not isinstance(tools, list):
            raise ParseError('"allowed-tools" must be an array')
        metadata.allowed_tools = [str(t) for t in tools]

    if data.get("metadata") is not None:
        if not isinstance(data["metadata"], dict):
            raise ParseError('"metadata" must be an object')
        metadata.metadata = data["metadata"]

    return metadata, post.content.strip()

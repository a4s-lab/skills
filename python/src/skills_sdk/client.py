from __future__ import annotations

import os
import posixpath
from dataclasses import dataclass

from .errors import SkillsError
from .github import GitHubClient, discover_skills
from .parser import parse_skill_md
from .store import Store
from .types import Metadata

SKILL_MD = "SKILL.md"


@dataclass
class ClientOptions:
    token: str | None = None
    base_url: str | None = None


@dataclass
class StoreOptions:
    name: str | None = None
    ref: str | None = None


class Client:
    def __init__(
        self,
        store: Store,
        base_path: str,
        options: ClientOptions | None = None,
    ) -> None:
        self._store = store
        self._base_path = base_path
        token = (options and options.token) or os.environ.get("SKILLS_GITHUB_TOKEN")
        base_url = (options and options.base_url) or os.environ.get("SKILLS_GITHUB_URL")
        self._fetcher = GitHubClient(token=token, base_url=base_url)

    async def close(self) -> None:
        await self._fetcher.close()

    async def __aenter__(self) -> Client:
        return self

    async def __aexit__(self, *exc: object) -> None:
        await self.close()

    async def list_remote(
        self, owner: str, repo: str, ref: str | None = None
    ) -> list[Metadata]:
        repo_files = await self._fetcher.fetch_repo(owner, repo, ref)
        discovered = discover_skills(repo_files)
        results: list[Metadata] = []
        for skill in discovered:
            metadata, _ = parse_skill_md(skill.skill_md_content.decode("utf-8"))
            results.append(metadata)
        return results

    async def store(
        self, owner: str, repo: str, options: StoreOptions | None = None
    ) -> None:
        repo_files = await self._fetcher.fetch_repo(
            owner, repo, options.ref if options else None
        )
        discovered = discover_skills(repo_files)

        if options and options.name:
            discovered = [s for s in discovered if s.directory_name == options.name]
            if not discovered:
                raise SkillsError(f'Skill "{options.name}" not found')

        for skill in discovered:
            metadata, _ = parse_skill_md(skill.skill_md_content.decode("utf-8"))
            skill_dir = posixpath.join(self._base_path, metadata.name)

            await self._store.write(
                posixpath.join(skill_dir, SKILL_MD), skill.skill_md_content
            )

            for rel_path, content in skill.files.items():
                await self._store.write(posixpath.join(skill_dir, rel_path), content)

    async def list_local(self) -> list[Metadata]:
        dirs = await self._store.list(self._base_path)
        results: list[Metadata] = []

        for d in dirs:
            skill_md_path = posixpath.join(self._base_path, d, SKILL_MD)
            if not await self._store.exists(skill_md_path):
                continue
            try:
                content = await self._store.read(skill_md_path)
                metadata, _ = parse_skill_md(content.decode("utf-8"))
                results.append(metadata)
            except Exception:
                pass

        return results

    async def get_metadata(self, name: str) -> Metadata:
        content = await self._store.read(
            posixpath.join(self._base_path, name, SKILL_MD)
        )
        metadata, _ = parse_skill_md(content.decode("utf-8"))
        return metadata

    async def get_skill_md(self, name: str) -> str:
        content = await self._store.read(
            posixpath.join(self._base_path, name, SKILL_MD)
        )
        return content.decode("utf-8")

    async def get_file(self, name: str, path: str) -> bytes:
        return await self._store.read(posixpath.join(self._base_path, name, path))

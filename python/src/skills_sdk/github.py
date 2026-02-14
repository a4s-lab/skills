from __future__ import annotations

from dataclasses import dataclass

import httpx

from .errors import GitHubFetchError
from .tarball import parse_tar_gz

DEFAULT_BASE_URL = "https://api.github.com"


@dataclass
class DiscoveredSkill:
    path: str
    directory_name: str
    skill_md_content: bytes
    files: dict[str, bytes]


class GitHubClient:
    def __init__(
        self,
        *,
        token: str | None = None,
        base_url: str | None = None,
    ) -> None:
        self._base_url = base_url or DEFAULT_BASE_URL
        headers: dict[str, str] = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        self._http = httpx.AsyncClient(headers=headers, follow_redirects=True)

    async def close(self) -> None:
        await self._http.aclose()

    async def fetch_repo(
        self, owner: str, repo: str, ref: str | None = None
    ) -> dict[str, bytes]:
        path = (
            f"/repos/{owner}/{repo}/tarball/{ref}"
            if ref
            else f"/repos/{owner}/{repo}/tarball"
        )
        url = f"{self._base_url}{path}"

        response = await self._http.get(url)

        if response.status_code >= 400:
            raise GitHubFetchError(
                response.status_code,
                f"GitHub API error: {response.status_code} {response.reason_phrase} for {path}",
            )

        return parse_tar_gz(response.content)


def discover_skills(files: dict[str, bytes]) -> list[DiscoveredSkill]:
    skills: list[DiscoveredSkill] = []

    for path, content in files.items():
        if path != "SKILL.md" and not path.endswith("/SKILL.md"):
            continue

        skill_dir = "" if path == "SKILL.md" else path[: path.rfind("/")]
        if "/" in skill_dir:
            directory_name = skill_dir[skill_dir.rfind("/") + 1 :]
        else:
            directory_name = skill_dir or "root"

        skill_files: dict[str, bytes] = {}
        for file_path, file_content in files.items():
            if file_path == path:
                continue
            if skill_dir == "":
                if "/" not in file_path:
                    skill_files[file_path] = file_content
            elif file_path.startswith(skill_dir + "/"):
                skill_files[file_path[len(skill_dir) + 1 :]] = file_content

        skills.append(
            DiscoveredSkill(
                path=skill_dir or ".",
                directory_name=directory_name,
                skill_md_content=content,
                files=skill_files,
            )
        )

    return skills

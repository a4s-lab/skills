from __future__ import annotations


class SkillsError(Exception):
    pass


class ParseError(SkillsError):
    pass


class GitHubFetchError(SkillsError):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status

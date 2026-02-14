# Skills SDK

SDK for managing and resolving [agent skills](https://agentskills.io).

## Why

[Agent skills](https://agentskills.io) are portable, reusable capabilities for AI agents. This SDK fetches, parses, and stores them so you can focus on building your agent.

## Packages

| Package                    | Description               |
| -------------------------- | ------------------------- |
| [skills-sdk](./js)         | JavaScript/TypeScript SDK |
| [skills-sdk](./python)     | Python SDK                |

## Install

```bash
# JavaScript/TypeScript
npm install skills-sdk

# Python
pip install skills-sdk
```

## Environment Variables

| Variable              | Required | Description                                                |
| --------------------- | -------- | ---------------------------------------------------------- |
| `SKILLS_GITHUB_TOKEN` | no       | GitHub personal access token for private repos             |
| `SKILLS_GITHUB_URL`   | no       | GitHub API base URL. Defaults to `https://api.github.com`. |
| `SKILLS_BASE_PATH`    | yes      | Base path for storing skills.                              |

## API

See [SPEC.md](./SPEC.md) for the full language-agnostic specification.

| Method                           | Description                                |
| -------------------------------- | ------------------------------------------ |
| `listRemote(owner, repo, ref?)`  | List all skill metadata from a GitHub repo |
| `store(owner, repo, ref?)`       | Fetch and store all skills from a repo     |
| `store(owner, repo, name, ref?)` | Fetch and store a single skill by name     |
| `listLocal()`                    | List metadata for all stored skills        |
| `getMetadata(name)`              | Get parsed frontmatter for a skill         |
| `getSkillMd(name)`               | Get raw SKILL.md content                   |
| `getFile(name, path)`            | Get a file from a stored skill             |

# Skills SDK for Python

Python SDK for fetching and managing [agent skills](https://agentskills.io) from GitHub repositories.

## Install

```bash
pip install skills-sdk
```

## Usage

```python
import asyncio
from skills_sdk import Client, Memory, ClientOptions

async def main():
    store = Memory()
    async with Client(store, "/skills", ClientOptions(token="ghp_...")) as client:
        # List skills in a remote repo
        skills = await client.list_remote("owner", "repo")
        for s in skills:
            print(s.name, s.description)

        # Download skills to local storage
        await client.store("owner", "repo")

        # Read from local storage
        local = await client.list_local()
        md = await client.get_skill_md("my-skill")
        meta = await client.get_metadata("my-skill")

asyncio.run(main())
```

### Filesystem store

```python
from skills_sdk import Client, FS

client = Client(FS(), "/tmp/skills")
```

### Environment variables

| Variable              | Description                                             |
| --------------------- | ------------------------------------------------------- |
| `SKILLS_BASE_PATH`    | Base path for storing skills (used when omitted)        |
| `SKILLS_GITHUB_TOKEN` | GitHub token for private repos                          |
| `SKILLS_GITHUB_URL`   | GitHub API base URL (default: `https://api.github.com`) |

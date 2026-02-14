# skills-sdk

TypeScript SDK for fetching and managing [agent skills](https://agentskills.io) from GitHub repositories.

## Install

```
npm install skills-sdk
```

## Usage

```ts
import { Client, FS } from "skills-sdk";

const client = new Client(new FS(), "/tmp/skills");
```

The client takes a storage backend and a base path. `FS` writes to disk, `Memory` keeps everything in-memory (useful for tests).

### Authentication

Pass a GitHub token directly or set it as an environment variable:

```ts
// explicit
const client = new Client(new FS(), "/tmp/skills", {
  token: "ghp_...",
});

// or via environment
// SKILLS_GITHUB_TOKEN=ghp_...
// SKILLS_GITHUB_URL=https://github.example.com/api/v3  (optional, for GHE)
const client = new Client(new FS(), "/tmp/skills");
```

### Fetch skills from GitHub

```ts
// fetch all skills from a repo
await client.store("owner", "repo");

// fetch a specific skill
await client.store("owner", "repo", { name: "my-skill" });

// fetch from a specific branch or tag
await client.store("owner", "repo", { ref: "v2" });
```

### List skills

```ts
// remote — reads from GitHub without storing anything
const remote = await client.listRemote("owner", "repo");

// local — reads from whatever you've already stored
const local = await client.listLocal();
```

Both return `Metadata[]` with `name`, `description`, and optional fields like `license`, `compatibility`, `allowedTools`.

### Read stored skills

```ts
const meta = await client.getMetadata("my-skill");
const raw = await client.getSkillMd("my-skill");
const file = await client.getFile("my-skill", "prompt.txt");
```

## Custom storage backends

The SDK ships with `FS` and `Memory`, but you can plug in any backend by implementing the `Store` interface:

```ts
import type { Store } from "skills-sdk";

class S3Store implements Store {
  async write(path: string, content: Buffer): Promise<void> {
    /* ... */
  }
  async read(path: string): Promise<Buffer> {
    /* ... */
  }
  async list(prefix: string): Promise<string[]> {
    /* ... */
  }
  async exists(path: string): Promise<boolean> {
    /* ... */
  }
  async delete(path: string): Promise<void> {
    /* ... */
  }
}

const client = new Client(new S3Store(), "skills/");
```

A few things to keep in mind when writing a backend:

- **`write`** should create any intermediate directories/prefixes as needed.
- **`list`** returns immediate child _directory_ names under the given prefix, not files. Think `ls`, not `find`.
- **`exists`** should return `true` for both files and directories.
- **`delete`** is recursive -- it removes the path and everything under it.
- Paths use `/` as the separator. The client never sends backslashes.

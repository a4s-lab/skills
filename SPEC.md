# Skills SDK Specification

Language-agnostic contract for implementing the skills SDK.

## Environment Variables

| Variable              | Required | Description                                                |
| --------------------- | -------- | ---------------------------------------------------------- |
| `SKILLS_GITHUB_TOKEN` | no       | GitHub personal access token for private repos             |
| `SKILLS_GITHUB_URL`   | no       | GitHub API base URL. Defaults to `https://api.github.com`. |
| `SKILLS_BASE_PATH`    | yes      | Base path for storing skills.                              |

## Types

[Official specification](https://agentskills.io/specification#frontmatter-required) for the skill metadata.

```
SkillMetadata {
  name:           string
  description:    string
  license?:       string
  compatibility?: string
  allowedTools?:  string[]
  metadata?:      map<string, any>
}
```

## Store Interface

Storage-agnostic file operations.

```
Store {
  write(path, content: bytes) -> void
  read(path) -> bytes
  list(prefix) -> string[]
  exists(path) -> bool
  delete(path) -> void
}
```

## Client API

The client takes a `FileStore` and `basePath`. All skill-level logic (parsing SKILL.md, resolving paths, assembling metadata) lives here.

### Remote (GitHub)

#### `listRemote(owner, repo, ref?) -> SkillMetadata[]`

Returns metadata for all skills found in the given GitHub repository. If `ref` is omitted, uses the repo's default branch.

#### `store(owner, repo, ref?) -> void`

Fetches all skills from the GitHub repository and writes them to storage at `{basePath}/{name}`.

#### `store(owner, repo, name, ref?) -> void`

Fetches a single skill by name from the GitHub repository and writes it to storage. Error if the skill is not found.

### Local (Storage)

#### `listLocal() -> SkillMetadata[]`

Returns metadata for all skills stored under `basePath`. Lists directories, reads each `{basePath}/{name}/SKILL.md`, and parses the frontmatter.

#### `getMetadata(name) -> SkillMetadata`

Returns the parsed frontmatter metadata for a stored skill. Reads `{basePath}/{name}/SKILL.md` via the file store and parses the YAML frontmatter.

#### `getSkillMd(name) -> string`

Returns the raw SKILL.md content as a string. Reads `{basePath}/{name}/SKILL.md` via the file store and returns it as-is.

#### `getFile(name, path) -> string | bytes`

Returns the content of a single file from a stored skill. Reads `{basePath}/{name}/{path}` via the file store.

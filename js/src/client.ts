import { join } from "node:path/posix";
import type { Store } from "./store/index.js";
import type { Metadata } from "./types.js";
import { GitHubClient, discoverSkills } from "./github.js";
import { parseSkillMd } from "./parser.js";
import { SkillsError } from "./errors.js";

const SKILL_MD = "SKILL.md";

export interface ClientOptions {
  token?: string;
  baseUrl?: string;
}

/**
 * Options for the {@link Client.store} method.
 */
export interface StoreOptions {
  /** Fetch only the skill with this name. Fetches all skills if omitted. */
  name?: string;
  /** Git ref (branch, tag, or SHA) to fetch from. Uses the default branch if omitted. */
  ref?: string;
}

/**
 * Main entry point for fetching skills from GitHub and reading them from local storage.
 *
 * Falls back to `SKILLS_GITHUB_TOKEN` and `SKILLS_GITHUB_URL` environment
 * variables when `ClientOptions` are not provided.
 */
export class Client {
  private fileStore: Store;
  private basePath: string;
  private fetcher: GitHubClient;

  constructor(store: Store, basePath: string, options?: ClientOptions) {
    this.fileStore = store;
    this.basePath = basePath;
    const token = options?.token ?? process.env.SKILLS_GITHUB_TOKEN;
    const baseUrl = options?.baseUrl ?? process.env.SKILLS_GITHUB_URL;
    this.fetcher = new GitHubClient({
      ...(token ? { token } : {}),
      ...(baseUrl ? { baseUrl } : {}),
    });
  }

  /** List metadata for all skills in a remote GitHub repository. */
  async listRemote(owner: string, repo: string, ref?: string): Promise<Metadata[]> {
    const tree = await this.fetcher.getTree(owner, repo, ref);
    const discovered = discoverSkills(tree);

    const results = await Promise.all(
      discovered.map(async (skill) => {
        const blob = await this.fetcher.getBlob(owner, repo, skill.skillMdSha);
        const content = Buffer.from(blob.content, "base64").toString("utf-8");
        const { metadata } = parseSkillMd(content);
        return metadata;
      }),
    );

    return results;
  }

  /** Fetch skills from a GitHub repository and write them to local storage. */
  async store(owner: string, repo: string, options?: StoreOptions): Promise<void> {
    const tree = await this.fetcher.getTree(owner, repo, options?.ref);
    let discovered = discoverSkills(tree);

    if (options?.name) {
      discovered = discovered.filter((s) => s.directoryName === options.name);
      if (discovered.length === 0) {
        throw new SkillsError(`Skill "${options.name}" not found`);
      }
    }

    for (const skill of discovered) {
      const skillBlob = await this.fetcher.getBlob(owner, repo, skill.skillMdSha);
      const skillContent = Buffer.from(skillBlob.content, "base64").toString("utf-8");
      const { metadata } = parseSkillMd(skillContent);

      const skillDir = join(this.basePath, metadata.name);
      await this.fileStore.write(join(skillDir, SKILL_MD), Buffer.from(skillContent, "utf-8"));

      const fileBlobs = await Promise.all(
        skill.files.map(async (fileEntry) => {
          const blob = await this.fetcher.getBlob(owner, repo, fileEntry.sha);
          const relPath = skill.path === "." ? fileEntry.path : fileEntry.path.slice(skill.path.length + 1);
          return { relPath, content: Buffer.from(blob.content, "base64") };
        }),
      );

      for (const { relPath, content } of fileBlobs) {
        await this.fileStore.write(join(skillDir, relPath), content);
      }
    }
  }

  /** List metadata for all skills stored locally under the base path. */
  async listLocal(): Promise<Metadata[]> {
    const dirs = await this.fileStore.list(this.basePath);
    const results: Metadata[] = [];

    for (const dir of dirs) {
      const skillMdPath = join(this.basePath, dir, SKILL_MD);
      if (!(await this.fileStore.exists(skillMdPath))) continue;

      try {
        const content = await this.fileStore.read(skillMdPath);
        const { metadata } = parseSkillMd(content.toString("utf-8"));
        results.push(metadata);
      } catch {
        // skip directories with invalid SKILL.md
      }
    }

    return results;
  }

  /** Get the parsed frontmatter metadata for a stored skill. */
  async getMetadata(name: string): Promise<Metadata> {
    const content = await this.fileStore.read(join(this.basePath, name, SKILL_MD));
    const { metadata } = parseSkillMd(content.toString("utf-8"));
    return metadata;
  }

  /** Get the raw SKILL.md content for a stored skill. */
  async getSkillMd(name: string): Promise<string> {
    const content = await this.fileStore.read(join(this.basePath, name, SKILL_MD));
    return content.toString("utf-8");
  }

  /** Get a single file from a stored skill by its relative path. */
  async getFile(name: string, path: string): Promise<Buffer> {
    return this.fileStore.read(join(this.basePath, name, path));
  }
}

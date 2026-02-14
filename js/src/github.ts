import { GitHubFetchError } from "./errors.js";
import { parseTarGz } from "./tarball.js";

const DEFAULT_BASE_URL = "https://api.github.com";

export interface DiscoveredSkill {
  path: string;
  directoryName: string;
  skillMdContent: Buffer;
  files: Map<string, Buffer>;
}

interface GitHubClientOptions {
  token?: string;
  baseUrl?: string;
}

export class GitHubClient {
  private baseUrl: string;
  private token: string | undefined;

  constructor(options?: GitHubClientOptions) {
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
    this.token = options?.token;
  }

  async fetchRepo(owner: string, repo: string, ref?: string): Promise<Map<string, Buffer>> {
    const path = ref ? `/repos/${owner}/${repo}/tarball/${ref}` : `/repos/${owner}/${repo}/tarball`;
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers, redirect: "follow" });
    if (!response.ok) {
      throw new GitHubFetchError(
        response.status,
        `GitHub API error: ${response.status} ${response.statusText} for ${path}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return parseTarGz(Buffer.from(arrayBuffer));
  }
}

export function discoverSkills(files: Map<string, Buffer>): DiscoveredSkill[] {
  // Pass 1: find all SKILL.md locations
  const skillMdEntries: { skillDir: string; content: Buffer }[] = [];
  for (const [path, content] of files) {
    if (path === "SKILL.md" || path.endsWith("/SKILL.md")) {
      const skillDir = path === "SKILL.md" ? "" : path.slice(0, path.lastIndexOf("/"));
      skillMdEntries.push({ skillDir, content });
    }
  }

  // Pass 2: bucket each non-SKILL.md file into its owning skill directory
  const buckets = new Map<string, Map<string, Buffer>>();
  for (const { skillDir } of skillMdEntries) {
    buckets.set(skillDir, new Map());
  }

  for (const [filePath, fileContent] of files) {
    if (filePath === "SKILL.md" || filePath.endsWith("/SKILL.md")) continue;

    for (const skillDir of buckets.keys()) {
      if (skillDir === "") {
        if (!filePath.includes("/")) {
          buckets.get(skillDir)!.set(filePath, fileContent);
        }
      } else if (filePath.startsWith(skillDir + "/")) {
        buckets.get(skillDir)!.set(filePath.slice(skillDir.length + 1), fileContent);
      }
    }
  }

  return skillMdEntries.map(({ skillDir, content }) => ({
    path: skillDir || ".",
    directoryName: getDirectoryName(skillDir),
    skillMdContent: content,
    files: buckets.get(skillDir)!,
  }));
}

function getDirectoryName(skillDir: string): string {
  if (!skillDir) return "root";
  const lastSlash = skillDir.lastIndexOf("/");
  return lastSlash === -1 ? skillDir : skillDir.slice(lastSlash + 1);
}

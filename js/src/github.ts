import { GitHubFetchError } from "./errors.js";

const DEFAULT_BASE_URL = "https://api.github.com";

interface GitHubTreeEntry {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
}

interface GitHubTree {
  sha: string;
  tree: GitHubTreeEntry[];
  truncated: boolean;
}

interface GitHubBlob {
  sha: string;
  content: string;
  encoding: string;
  size: number;
}

export interface DiscoveredSkill {
  path: string;
  directoryName: string;
  skillMdSha: string;
  files: GitHubTreeEntry[];
}

interface GitHubClientOptions {
  token?: string;
  baseUrl?: string;
}

/**
 * Client for the GitHub REST API.
 */
export class GitHubClient {
  private baseUrl: string;
  private token: string | undefined;

  constructor(options?: GitHubClientOptions) {
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
    this.token = options?.token;
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new GitHubFetchError(
        response.status,
        `GitHub API error: ${response.status} ${response.statusText} for ${path}`,
      );
    }

    return response.json() as Promise<T>;
  }

  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const data = await this.request<{ default_branch: string }>(`/repos/${owner}/${repo}`);
    return data.default_branch;
  }

  async getTree(owner: string, repo: string, ref?: string): Promise<GitHubTree> {
    const resolvedRef = ref ?? (await this.getDefaultBranch(owner, repo));
    return this.request<GitHubTree>(`/repos/${owner}/${repo}/git/trees/${resolvedRef}?recursive=1`);
  }

  async getBlob(owner: string, repo: string, sha: string): Promise<GitHubBlob> {
    return this.request<GitHubBlob>(`/repos/${owner}/${repo}/git/blobs/${sha}`);
  }
}

export function discoverSkills(tree: GitHubTree): DiscoveredSkill[] {
  const skillEntries = tree.tree.filter(
    (entry) => entry.type === "blob" && (entry.path === "SKILL.md" || entry.path.endsWith("/SKILL.md")),
  );

  return skillEntries.map((entry) => {
    const skillDir = entry.path === "SKILL.md" ? "" : entry.path.slice(0, entry.path.lastIndexOf("/"));

    const directoryName = skillDir.includes("/") ? skillDir.slice(skillDir.lastIndexOf("/") + 1) : skillDir || "root";

    const files = tree.tree.filter(
      (e) =>
        e.type === "blob" &&
        e.path !== entry.path &&
        (skillDir === "" ? !e.path.includes("/") : e.path.startsWith(skillDir + "/")),
    );

    return {
      path: skillDir || ".",
      directoryName,
      skillMdSha: entry.sha,
      files,
    };
  });
}

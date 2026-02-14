/**
 * Base error class for all skills-related errors.
 */
export class SkillsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillsError";
  }
}

/**
 * Error thrown when a SKILL.md file cannot be parsed.
 */
export class ParseError extends SkillsError {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/**
 * Error thrown when a GitHub API request fails.
 */
export class GitHubFetchError extends SkillsError {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GitHubFetchError";
    this.status = status;
  }
}

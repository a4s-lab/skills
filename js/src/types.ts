/**
 * The frontmatter of a SKILL.md.
 */
export interface Metadata {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  allowedTools?: string[];
  metadata?: Record<string, unknown>;
}

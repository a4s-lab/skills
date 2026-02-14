import matter from "gray-matter";
import type { Metadata } from "./types.js";
import { ParseError } from "./errors.js";

/**
 * Parse a SKILL.md file into its metadata and body.
 */
export function parseSkillMd(content: string): {
  metadata: Metadata;
  body: string;
} {
  const { data, content: body } = matter(content);

  if (!data.name || typeof data.name !== "string") {
    throw new ParseError('SKILL.md frontmatter must include a "name" field');
  }
  if (!data.description || typeof data.description !== "string") {
    throw new ParseError('SKILL.md frontmatter must include a "description" field');
  }

  const metadata: Metadata = {
    name: data.name,
    description: data.description,
  };

  if (data.license != null) {
    metadata.license = String(data.license);
  }

  if (data.compatibility != null) {
    metadata.compatibility = String(data.compatibility);
  }

  const tools = data["allowed-tools"] ?? data.allowedTools;
  if (tools != null) {
    if (!Array.isArray(tools)) {
      throw new ParseError('"allowed-tools" must be an array');
    }
    metadata.allowedTools = tools.map(String);
  }

  if (data.metadata != null) {
    if (typeof data.metadata !== "object" || Array.isArray(data.metadata)) {
      throw new ParseError('"metadata" must be an object');
    }
    metadata.metadata = data.metadata as Record<string, unknown>;
  }

  return { metadata, body: body.trim() };
}

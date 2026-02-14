import { describe, it, expect } from "vitest";
import { parseSkillMd } from "../src/parser.js";
import { ParseError } from "../src/errors.js";

describe("parseSkillMd", () => {
  it("parses valid frontmatter with all optional fields", () => {
    const md = `---
name: my-skill
description: A skill
license: MIT
compatibility: '>=1.0'
allowed-tools: ["bash", "read"]
metadata: { key: value }
---
Body here`;
    const { metadata, body } = parseSkillMd(md);
    expect(metadata.name).toBe("my-skill");
    expect(metadata.description).toBe("A skill");
    expect(metadata.license).toBe("MIT");
    expect(metadata.compatibility).toBe(">=1.0");
    expect(metadata.allowedTools).toEqual(["bash", "read"]);
    expect(metadata.metadata).toEqual({ key: "value" });
    expect(body).toBe("Body here");
  });

  it("accepts allowedTools as alias for allowed-tools", () => {
    const md = `---
name: s
description: d
allowedTools: ["x"]
---`;
    const { metadata } = parseSkillMd(md);
    expect(metadata.allowedTools).toEqual(["x"]);
  });

  it("trims body content", () => {
    const md = `---
name: s
description: d
---
  hello

`;
    const { body } = parseSkillMd(md);
    expect(body).toBe("hello");
  });

  it("throws ParseError when name is missing", () => {
    const md = `---
description: d
---`;
    expect(() => parseSkillMd(md)).toThrow(ParseError);
  });

  it("throws ParseError when description is missing", () => {
    const md = `---
name: s
---`;
    expect(() => parseSkillMd(md)).toThrow(ParseError);
  });

  it("throws ParseError when allowed-tools is not an array", () => {
    const md = `---
name: s
description: d
allowed-tools: notarray
---`;
    expect(() => parseSkillMd(md)).toThrow(ParseError);
  });

  it("throws ParseError when metadata is an array", () => {
    const md = `---
name: s
description: d
metadata: [1, 2]
---`;
    expect(() => parseSkillMd(md)).toThrow(ParseError);
  });

  it("throws ParseError when metadata is a non-object", () => {
    const md = `---
name: s
description: d
metadata: just-a-string
---`;
    expect(() => parseSkillMd(md)).toThrow(ParseError);
  });
});

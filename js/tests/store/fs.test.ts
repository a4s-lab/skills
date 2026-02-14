import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FS } from "../../src/store/fs.js";

describe("FS", () => {
  let dir: string;
  let store: FS;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "fs-test-"));
    store = new FS();
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("write creates parent dirs and read returns content", async () => {
    const path = join(dir, "a", "b", "file.txt");
    const buf = Buffer.from("hello");
    await store.write(path, buf);
    expect(await store.read(path)).toEqual(buf);
  });

  it("read throws on nonexistent path", async () => {
    await expect(store.read(join(dir, "nope"))).rejects.toThrow();
  });

  it("list returns directory names only", async () => {
    await mkdir(join(dir, "sub1"));
    await mkdir(join(dir, "sub2"));
    await writeFile(join(dir, "file.txt"), "");
    const dirs = await store.list(dir);
    expect(dirs.sort()).toEqual(["sub1", "sub2"]);
  });

  it("exists returns true for file and false for nonexistent", async () => {
    const path = join(dir, "exists.txt");
    await writeFile(path, "");
    expect(await store.exists(path)).toBe(true);
    expect(await store.exists(join(dir, "nope"))).toBe(false);
  });

  it("delete removes recursively", async () => {
    const sub = join(dir, "sub");
    await mkdir(sub);
    await writeFile(join(sub, "file"), "");
    await store.delete(sub);
    expect(await store.exists(sub)).toBe(false);
  });
});

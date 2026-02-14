import { describe, it, expect, beforeEach } from "vitest";
import { Memory } from "../../src/store/memory.js";

describe("Memory", () => {
  let store: Memory;

  beforeEach(() => {
    store = new Memory();
  });

  it("write then read returns the same content", async () => {
    const buf = Buffer.from("hello");
    await store.write("a/b", buf);
    expect(await store.read("a/b")).toEqual(buf);
  });

  it("read throws on nonexistent path", async () => {
    await expect(store.read("nope")).rejects.toThrow("ENOENT: no such file: nope");
  });

  it("list returns immediate child directory names", async () => {
    await store.write("base/a/file", Buffer.from(""));
    await store.write("base/b/file", Buffer.from(""));
    await store.write("base/b/sub/file", Buffer.from(""));
    const dirs = await store.list("base");
    expect(dirs.sort()).toEqual(["a", "b"]);
  });

  it("list returns empty array when no children", async () => {
    expect(await store.list("empty")).toEqual([]);
  });

  it("exists returns true for exact file path", async () => {
    await store.write("x", Buffer.from(""));
    expect(await store.exists("x")).toBe(true);
  });

  it("exists returns true for directory prefix", async () => {
    await store.write("dir/a/file", Buffer.from(""));
    expect(await store.exists("dir/a")).toBe(true);
  });

  it("exists returns false for nonexistent path", async () => {
    expect(await store.exists("nope")).toBe(false);
  });

  it("delete removes exact path and all children", async () => {
    await store.write("dir/a", Buffer.from(""));
    await store.write("dir/a/b", Buffer.from(""));
    await store.write("dir/x", Buffer.from(""));
    await store.delete("dir/a");
    expect(await store.exists("dir/a")).toBe(false);
    expect(await store.exists("dir/a/b")).toBe(false);
    expect(await store.exists("dir/x")).toBe(true);
  });
});

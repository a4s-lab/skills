import { readFile, writeFile, readdir, stat, rm, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { Store } from "./index.js";

export class FS implements Store {
  async write(path: string, content: Buffer): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }

  async read(path: string): Promise<Buffer> {
    return readFile(path);
  }

  async list(prefix: string): Promise<string[]> {
    const entries = await readdir(prefix, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }

  async delete(path: string): Promise<void> {
    await rm(path, { recursive: true, force: true });
  }
}

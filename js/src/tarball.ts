import { gunzipSync } from "node:zlib";

// POSIX tar header field offsets and sizes (bytes)
const BLOCK_SIZE = 512;
const NAME_OFFSET = 0;
const NAME_LENGTH = 100;
const SIZE_OFFSET = 124;
const SIZE_LENGTH = 12;
const TYPEFLAG_OFFSET = 156;
const PREFIX_OFFSET = 345;
const PREFIX_LENGTH = 155;

export function parseTarGz(compressed: Buffer): Map<string, Buffer> {
  const tar = gunzipSync(compressed);
  const files = new Map<string, Buffer>();
  let offset = 0;
  let paxPath: string | undefined;

  // GitHub tarballs nest all files under a single prefix directory (e.g. "owner-repo-sha/").
  // We detect this from the first path containing "/" and strip it from all entries.
  let stripPrefix = "";

  while (offset + BLOCK_SIZE <= tar.length) {
    const header = tar.subarray(offset, offset + BLOCK_SIZE);

    if (header.every((b) => b === 0)) break;

    const name = readString(header, NAME_OFFSET, NAME_LENGTH);
    const size = readOctal(header, SIZE_OFFSET, SIZE_LENGTH);
    const typeflag = String.fromCharCode(header[TYPEFLAG_OFFSET]!);
    const prefix = readString(header, PREFIX_OFFSET, PREFIX_LENGTH);

    const fullName = prefix ? `${prefix}/${name}` : name;
    const dataBlocks = size > 0 ? Math.ceil(size / BLOCK_SIZE) * BLOCK_SIZE : 0;

    offset += BLOCK_SIZE;

    if (typeflag === "x") {
      const paxData = tar.subarray(offset, offset + size).toString("utf-8");
      paxPath = extractPaxPath(paxData);
      offset += dataBlocks;
      continue;
    }

    let path = paxPath ?? fullName;
    paxPath = undefined;

    if (!stripPrefix && path.includes("/")) {
      stripPrefix = path.slice(0, path.indexOf("/") + 1);
    }

    if (stripPrefix && path.startsWith(stripPrefix)) {
      path = path.slice(stripPrefix.length);
    }

    if ((typeflag === "0" || typeflag === "\0") && path) {
      files.set(path, Buffer.from(tar.subarray(offset, offset + size)));
    }

    offset += dataBlocks;
  }

  return files;
}

function readString(buf: Buffer, offset: number, length: number): string {
  const slice = buf.subarray(offset, offset + length);
  const nullIdx = slice.indexOf(0);
  return slice.subarray(0, nullIdx === -1 ? length : nullIdx).toString("utf-8");
}

function readOctal(buf: Buffer, offset: number, length: number): number {
  const str = readString(buf, offset, length).trim();
  return str ? parseInt(str, 8) : 0;
}

function extractPaxPath(data: string): string | undefined {
  for (const line of data.split("\n")) {
    const match = line.match(/^\d+ path=(.+)/);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

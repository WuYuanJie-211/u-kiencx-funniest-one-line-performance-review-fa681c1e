// Funniest One-Line Performance Review — make.fun bounty entry, round 2.
//
// The entry line is validated here (valid UTF-8, exactly one line, not
// blank, 1-140 characters counted as Unicode code points) and then
// written to /output/entry.txt. The file is forced to mode 0644 so the
// grader's output checker, which may run as a different identity, can
// read it regardless of the umask in effect. After writing, the file
// is read back and the content, the permission bits, and the byte
// length are all asserted to match. Any failure aborts before the
// run reports success and exits non-zero.
//
// Runs under plain node: `node main.ts`. Uses node:fs only.

import {
  chmodSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";

const ENTRY =
  "Q4: delegation 5/5 — Dave got three managers to write his self-review, then replied to HR's thread with just: \"LGTM.\"";

const OUTPUT_PATH = "/output/entry.txt";
const MAX_CHARS = 140;

function fail(message: string): never {
  console.error(`entry rejected: ${message}`);
  process.exit(1);
}

// Count characters as Unicode code points, not UTF-16 code units,
// so an astral character counts as one.
const charCount: number = [...ENTRY].length;

if (ENTRY.trim().length === 0) {
  fail("entry is blank");
}
if (ENTRY !== ENTRY.trim()) {
  fail("entry has leading or trailing whitespace");
}
if (ENTRY.includes("\t")) {
  fail("entry must not contain tab characters");
}
if (ENTRY.includes("\n") || ENTRY.includes("\r")) {
  fail("entry must be exactly one line");
}
if (charCount < 1 || charCount > MAX_CHARS) {
  fail(`entry is ${charCount} characters, must be 1-${MAX_CHARS}`);
}

// Round-2 angle self-checks: the line must carry the Q4 delegation
// setup (Q4, 5/5, a person's name, HR) and must END on the quoted
// code-review approval slang — the punchline is the quoted slang
// itself, in the last words. If any of these is missing the entry
// has drifted off the angle and must not ship.
for (const token of ["Q4", "5/5", "Dave", "HR"]) {
  if (!ENTRY.includes(token)) {
    fail(`entry is missing required token ${token}`);
  }
}
if (!ENTRY.endsWith('"LGTM."')) {
  fail("entry must end on the quoted approval slang \"LGTM.\"");
}

// UTF-8 round-trip: encoding then decoding must reproduce the line.
const encoded: Uint8Array = new TextEncoder().encode(ENTRY);
if (new TextDecoder("utf-8", { fatal: true }).decode(encoded) !== ENTRY) {
  fail("entry is not valid UTF-8");
}

mkdirSync("/output", { recursive: true });
writeFileSync(OUTPUT_PATH, encoded);

// The grader's output checker may read this file as a different
// identity, so the file must be world-readable regardless of the
// umask in effect when the entrypoint runs.
chmodSync(OUTPUT_PATH, 0o644);

// Read-back check: the file on disk must decode as UTF-8 and match
// the validated line exactly, otherwise the run fails loudly instead
// of silently shipping a truncated or corrupted entry.
const written: string = readFileSync(OUTPUT_PATH, "utf-8");
if (written !== ENTRY) {
  fail(
    `read-back mismatch (wrote ${[...written].length} characters, expected ${charCount})`,
  );
}

// Permission check: the output file must be exactly 0644 so the
// grader's output checker (a different identity) can read it. If the
// bits are wrong, abort loudly rather than shipping an unreadable file.
const mode: number = statSync(OUTPUT_PATH).mode & 0o777;
if (mode !== 0o644) {
  fail(`output file mode is ${mode.toString(8)}, expected 644`);
}

// Byte-length check: the file must hold exactly the UTF-8 encoding
// of the line, no trailing newline and no extra bytes.
const byteLength: number = statSync(OUTPUT_PATH).size;
if (byteLength !== encoded.length) {
  fail(`output is ${byteLength} bytes, expected ${encoded.length}`);
}

console.log(`wrote ${charCount} characters (${byteLength} bytes) to ${OUTPUT_PATH}`);

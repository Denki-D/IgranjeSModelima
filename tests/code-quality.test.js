const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const html = readFileSync(path.join(root, "index.html"), "utf8");
const app = readFileSync(path.join(root, "app.js"), "utf8");

test("app.js parses without syntax errors", () => {
  const result = spawnSync(process.execPath, ["--check", path.join(root, "app.js")], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("HTML IDs are unique and satisfy app.js selectors", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const uniqueIds = new Set(ids);
  const selectors = [...app.matchAll(/document\.querySelector\(["']#([^"']+)["']\)/g)]
    .map((match) => match[1]);
  const missingIds = [...new Set(selectors.filter((id) => !uniqueIds.has(id)))];

  assert.equal(uniqueIds.size, ids.length, "index.html contains duplicate IDs");
  assert.deepEqual(missingIds, [], `app.js selects IDs missing from index.html: ${missingIds.join(", ")}`);
});

test("HTML stylesheet and script references point to local files", () => {
  const tags = [...html.matchAll(/<(?:link|script)\b[^>]*>/g)].map((match) => match[0]);
  const references = tags.flatMap((tag) => {
    const reference = tag.match(/\b(?:href|src)="([^"]+)"/);
    return reference ? [reference[1]] : [];
  });

  assert.notEqual(references.length, 0, "index.html has no local stylesheet or script references");
  for (const reference of references) {
    assert.equal(
      existsSync(path.join(root, reference)),
      true,
      `index.html references a missing local asset: ${reference}`,
    );
  }
});

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const extensionRoot = path.join(__dirname, "..", "src");
const manifestPath = path.join(extensionRoot, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

test("manifest declares the required Manifest V3 fields", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.background.service_worker, "js/background.js");
  assert.equal(manifest.action.default_popup, "html/popup.html");
  assert.equal(manifest.browser_action, undefined);
  assert.equal(manifest.background.scripts, undefined);
  assert.deepEqual(manifest.content_security_policy, {
    extension_pages: "script-src 'self'; object-src 'none'"
  });
});

test("every local resource declared by the manifest exists", () => {
  const resources = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...Object.values(manifest.icons),
    manifest.action.default_icon,
    ...manifest.content_scripts.flatMap((contentScript) => [
      ...(contentScript.js || []),
      ...(contentScript.css || [])
    ])
  ];

  for (const resource of resources) {
    assert.ok(
      fs.existsSync(path.join(extensionRoot, resource)),
      `Manifest resource does not exist: ${resource}`
    );
  }
});

test("extension source does not use removed MV2 or remote-code patterns", () => {
  const sourceFiles = [
    "manifest.json",
    "html/popup.html",
    "js/background.js",
    "js/popup.js",
    "js/endScript.js"
  ];
  const prohibitedPatterns = [
    /chrome\.app\b/,
    /browser_action/,
    /google-analytics\.com/,
    /\beval\s*\(/,
    /new\s+Function\b/
  ];

  for (const relativePath of sourceFiles) {
    const source = fs.readFileSync(path.join(extensionRoot, relativePath), "utf8");
    for (const pattern of prohibitedPatterns) {
      assert.doesNotMatch(source, pattern, `${relativePath} contains ${pattern}`);
    }
  }
});

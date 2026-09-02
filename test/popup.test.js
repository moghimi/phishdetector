const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const popupSource = fs.readFileSync(
  path.join(__dirname, "..", "src", "js", "popup.js"),
  "utf8"
);

function runPopup(response, { hasActiveTab = true } = {}) {
  const classes = new Set(["loading"]);
  const elements = {
    copyright: { innerHTML: "" },
    result: {
      innerHTML: "",
      classList: {
        add: (...names) => names.forEach((name) => classes.add(name)),
        remove: (...names) => names.forEach((name) => classes.delete(name))
      }
    }
  };

  const context = {
    chrome: {
      runtime: {
        getManifest: () => ({ version: "1.4.0" })
      },
      tabs: {
        query: (_query, callback) => callback(hasActiveTab ? [{ id: 42 }] : []),
        sendMessage: (_tabId, message, callback) => {
          assert.equal(message.type, "getFeatures");
          assert.deepEqual(Object.keys(message), ["type"]);
          callback(response);
        }
      }
    },
    Date,
    document: {
      getElementById: (id) => elements[id]
    },
    window: {}
  };

  vm.runInNewContext(popupSource, context, { filename: "popup.js" });
  context.window.onload();

  return { classes, elements };
}

function features(overrides) {
  return {
    URL: "https://bank.example/login",
    Domain: "bank.example",
    F2: 1,
    F4: 0.02,
    F5: 0.1,
    F8: 0,
    F13: 0.5,
    F16: 0.5,
    F17: 0.5,
    ...overrides
  };
}

const decisionRules = [
  [1, "Phishing", features({ F16: 0.6, F13: 0.4 })],
  [2, "Legitimate", features({ F16: 0.6, F13: 0.3 })],
  [3, "Phishing", features({ F16: 0.5, F8: 0.1 })],
  [4, "Phishing", features({ F16: 0.5, F8: 0, F4: 0.02, F13: 0.8, F17: 0.7 })],
  [5, "Legitimate", features({ F16: 0.5, F8: 0, F4: 0.02, F13: 0.8, F17: 0.6 })],
  [6, "Legitimate", features({ F16: 0.5, F8: 0, F4: 0.02, F13: 0.7 })],
  [7, "Phishing", features({ F16: 0.5, F8: 0, F4: 0.01 })],
  [8, "Phishing", features({ F2: 0, F8: 0 })],
  [9, "Phishing", features({ F2: 0, F8: -1, F16: 0.2 })],
  [10, "Phishing", features({ F2: 0, F8: -1, F16: 0.1, F4: 0.04, F13: 0.5 })],
  [11, "Legitimate", features({ F2: 0, F8: -1, F16: 0.1, F4: 0.04, F13: 0.1 })],
  [12, "Legitimate", features({ F2: 0, F8: -1, F16: 0.1, F4: 0.05, F13: 0.004 })],
  [13, "Phishing", features({ F2: 0, F8: -1, F16: 0.1, F4: 0.04, F13: 0.004 })],
  [14, "Phishing", features({ F2: 0, F8: -1, F16: 0.1, F4: 0.03, F13: 0.004 })]
];

for (const [rule, expectedResult, response] of decisionRules) {
  test(`decision rule ${rule} reports ${expectedResult}`, () => {
    const { classes, elements } = runPopup(response);

    assert.equal(classes.has("loading"), false);
    assert.equal(classes.has(expectedResult), true);
    assert.notEqual(elements.result.innerHTML, "");
    assert.match(elements.copyright.innerHTML, /1\.4\.0$/);
  });
}

test("missing content-script response reports an unknown result", () => {
  const { classes, elements } = runPopup(undefined);

  assert.equal(classes.has("Unknown"), true);
  assert.match(elements.result.innerHTML, /refresh the webpage/i);
});

test("missing active tab reports an unknown result", () => {
  const { classes, elements } = runPopup(undefined, { hasActiveTab: false });

  assert.equal(classes.has("Unknown"), true);
  assert.match(elements.result.innerHTML, /no active webpage/i);
});

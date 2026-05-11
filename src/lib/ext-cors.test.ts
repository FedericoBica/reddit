import assert from "node:assert/strict";
import test from "node:test";
import { buildExtCorsHeaders, isAllowedExtOrigin } from "./ext-cors";

test("isAllowedExtOrigin allows extension origins", () => {
  assert.equal(isAllowedExtOrigin("chrome-extension://abcdef"), true);
  assert.equal(isAllowedExtOrigin("moz-extension://abcdef"), true);
});

test("isAllowedExtOrigin allows approved local and production web origins", () => {
  assert.equal(isAllowedExtOrigin("http://localhost:3000"), true);
  assert.equal(isAllowedExtOrigin("https://127.0.0.1:4000"), true);
  assert.equal(isAllowedExtOrigin("https://prowlit.com"), true);
  assert.equal(isAllowedExtOrigin("https://app.prowlit.com"), true);
});

test("isAllowedExtOrigin rejects malformed or unapproved origins", () => {
  assert.equal(isAllowedExtOrigin(""), false);
  assert.equal(isAllowedExtOrigin("not-a-url"), false);
  assert.equal(isAllowedExtOrigin("file:///tmp/test"), false);
  assert.equal(isAllowedExtOrigin("https://evil.com"), false);
  assert.equal(isAllowedExtOrigin("https://prowlit.com.evil.com"), false);
});

test("buildExtCorsHeaders mirrors only allowed origins", () => {
  assert.deepEqual(buildExtCorsHeaders("https://app.prowlit.com"), {
    "Access-Control-Allow-Origin": "https://app.prowlit.com",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  });
  assert.equal(buildExtCorsHeaders("https://evil.com"), null);
  assert.equal(buildExtCorsHeaders(null), null);
});

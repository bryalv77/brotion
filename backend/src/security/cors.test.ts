import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedOrigin } from "./cors.js";

test("isAllowedOrigin allows native clients, localhost and the configured web origin only", () => {
  const web = "https://app.example.com";
  assert.equal(isAllowedOrigin(undefined, web), true);
  assert.equal(isAllowedOrigin("null", web), true);
  assert.equal(isAllowedOrigin("http://localhost:8081", web), true);
  assert.equal(isAllowedOrigin(web, web), true);
  assert.equal(isAllowedOrigin("https://evil.example.com", web), false);
  assert.equal(isAllowedOrigin("http://localhost.evil.com", web), false);
});

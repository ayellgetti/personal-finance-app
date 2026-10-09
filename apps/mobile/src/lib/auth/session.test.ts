import { describe, expect, it } from "vitest";
import { isAccessTokenFresh, readJwtExpiryMs } from "@/lib/auth/session";

function tokenWithExp(expSeconds: number) {
  const payload = btoa(JSON.stringify({ exp: expSeconds }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${payload}.sig`;
}

describe("access token freshness", () => {
  it("treats a token as stale 30s before expiry", () => {
    const now = 1_700_000_000_000;
    const token = tokenWithExp(Math.floor(now / 1000) + 10);
    expect(readJwtExpiryMs(token)).toBe(now + 10_000);
    expect(isAccessTokenFresh(token, now)).toBe(false);
  });

  it("treats a token as fresh when expiry is more than 30s away", () => {
    const now = 1_700_000_000_000;
    const token = tokenWithExp(Math.floor(now / 1000) + 120);
    expect(isAccessTokenFresh(token, now)).toBe(true);
  });
});

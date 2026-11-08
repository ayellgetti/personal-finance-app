import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import { errorHandler } from "../middlewares/error-handler.middleware";
import { failureLogService } from "../modules/shared/logging/failure-log.service";
import { HttpError } from "../utils/http-error.util";

function fakeRes(locals: Record<string, unknown>) {
  const res = {
    locals,
    headersSent: false,
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json() {
      return this;
    },
    setHeader() {
      return this;
    },
  };
  return res as unknown as Response;
}

async function run(err: unknown, locals: Record<string, unknown>) {
  const original = failureLogService.record;
  let recorded = 0;
  failureLogService.record = (async () => {
    recorded += 1;
  }) as typeof failureLogService.record;
  try {
    const req = { requestId: "r1", method: "GET", path: "/x", originalUrl: "/x", headers: {} } as unknown as Request;
    await errorHandler(err, req, fakeRes(locals), () => undefined);
  } finally {
    failureLogService.record = original;
  }
  return recorded;
}

test("a normal 4xx is recorded in the failure log", async () => {
  assert.equal(await run(new HttpError(404, "nope"), {}), 1);
});

test("a public route can opt out of logging expected 4xx answers", async () => {
  assert.equal(await run(new HttpError(404, "nope"), { skipFailureLogFor4xx: true }), 0);
  assert.equal(await run(new HttpError(422, "bad"), { skipFailureLogFor4xx: true }), 0);
});

test("server errors are always recorded, even on an opted-out route", async () => {
  assert.equal(await run(new Error("boom"), { skipFailureLogFor4xx: true }), 1);
});

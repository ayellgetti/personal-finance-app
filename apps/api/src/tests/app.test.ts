import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { App, app } from "../config/app";

test("App exposes a single initialized instance", () => {
  assert.equal(App.getInstance(), app);
  assert.equal(App.getInstance(), App.getInstance());
});

test("health route is mounted on the initialized app", async () => {
  const server = createServer(app.express);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const address = server.address();
    assert(address && typeof address !== "string");

    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const body = (await response.json()) as {
      code: number;
      success: boolean;
      data: { ok: boolean };
      message: string;
    };

    assert.equal(response.status, 200);
    assert.equal(body.code, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.data, { ok: true });
    assert.equal(body.message, "API is healthy");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});

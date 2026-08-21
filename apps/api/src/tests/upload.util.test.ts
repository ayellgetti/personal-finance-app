import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import multer from "multer";
import { createUpload } from "../utils/upload.util";

test("createUpload accepts a replaceable storage provider", async () => {
  const testApp = express();
  const testUpload = createUpload({ storage: multer.memoryStorage() });

  testApp.post("/upload", testUpload.single("file"), (req, res) => {
    res.json({
      filename: req.file?.originalname,
      contents: req.file?.buffer.toString("utf8"),
    });
  });

  const server = createServer(testApp);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const address = server.address();
    assert(address && typeof address !== "string");

    const form = new FormData();
    form.append("file", new Blob(["upload contents"]), "sample.txt");

    const response = await fetch(`http://127.0.0.1:${address.port}/upload`, {
      method: "POST",
      body: form,
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      filename: "sample.txt",
      contents: "upload contents",
    });
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

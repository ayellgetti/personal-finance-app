import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import type { CrmCompanyProfile } from "@prisma/client";
import { resolveEnvLogo } from "../modules/sales-crm/company/company.logo";
import {
  CompanyService,
  type CompanyLetterhead,
  type CompanyProfileStore,
} from "../modules/sales-crm/company/company.service";

const EMPTY: CompanyLetterhead = {
  name: "",
  details: "",
  contactName: "",
  contactMobile: "",
  logoUrl: "",
};

const ENV_DEFAULTS: CompanyLetterhead = {
  name: "Env Banquet",
  details: "12 Lake Road",
  contactName: "Rita Shah",
  contactMobile: "+919800000000",
  logoUrl: "https://cdn.example/logo.png",
};

function memoryStore(): CompanyProfileStore & { row: CrmCompanyProfile | null } {
  const store = {
    row: null as CrmCompanyProfile | null,
    async findOne() {
      return store.row;
    },
    async create(data: {
      name: string;
      details: string;
      contactName: string;
      contactMobile: string;
      logoDataUrl?: string | null;
      createdBy?: string;
      updatedBy?: string;
    }) {
      const now = new Date();
      store.row = {
        id: "company-1",
        name: data.name,
        details: data.details,
        contactName: data.contactName,
        contactMobile: data.contactMobile,
        logoDataUrl: data.logoDataUrl ?? null,
        isActive: 1,
        createdBy: data.createdBy ?? null,
        createdAt: now,
        updatedBy: data.updatedBy ?? null,
        updatedAt: now,
        deletedBy: null,
        deletedAt: null,
      };
      return store.row;
    },
    async update(
      where: { id: string },
      data: Partial<CrmCompanyProfile>,
    ) {
      if (!store.row || store.row.id !== where.id) {
        throw new Error("missing company profile");
      }
      store.row = { ...store.row, ...data, updatedAt: new Date() };
      return store.row;
    },
  };
  return store;
}

test("company profile uses environment defaults until a field is saved", async () => {
  const service = new CompanyService(memoryStore(), () => ENV_DEFAULTS);
  const initial = await service.get();
  assert.deepEqual(initial.saved, EMPTY);
  assert.deepEqual(initial.company, ENV_DEFAULTS);

  const saved = await service.update("user-1", {
    name: "Saved Hall",
    details: "",
    contactName: "",
    contactMobile: "9811111111",
  });
  assert.equal(saved.company.name, "Saved Hall");
  assert.equal(saved.company.details, "12 Lake Road");
  assert.equal(saved.company.contactName, "Rita Shah");
  assert.equal(saved.company.contactMobile, "9811111111");
  assert.equal(saved.company.logoUrl, "https://cdn.example/logo.png");
});

test("clearing the saved logo falls back to the environment logo", async () => {
  const service = new CompanyService(memoryStore(), () => ENV_DEFAULTS);
  await service.update("user-1", {
    name: "Saved Hall",
    details: "Hall lane",
    contactName: "Asha",
    contactMobile: "9811111111",
    logo: "data:image/png;base64,aaaa",
  });
  const cleared = await service.update("user-1", {
    name: "Saved Hall",
    details: "Hall lane",
    contactName: "Asha",
    contactMobile: "9811111111",
    logo: null,
  });
  assert.equal(cleared.saved.logoUrl, "");
  assert.equal(cleared.company.logoUrl, "https://cdn.example/logo.png");
});

test("environment logo accepts a URL and rejects paths outside the API directory", () => {
  assert.equal(resolveEnvLogo("  https://cdn.example/logo.png "), "https://cdn.example/logo.png");
  assert.equal(resolveEnvLogo("data:image/png;base64,aaaa"), "data:image/png;base64,aaaa");
  assert.equal(resolveEnvLogo(""), "");
  assert.equal(resolveEnvLogo("../.env"), "");
  assert.equal(resolveEnvLogo("/etc/passwd"), "");

  const outside = mkdtempSync(path.join(tmpdir(), "crm-logo-"));
  const file = path.join(outside, "logo.png");
  writeFileSync(file, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  assert.equal(resolveEnvLogo(file), "");
});

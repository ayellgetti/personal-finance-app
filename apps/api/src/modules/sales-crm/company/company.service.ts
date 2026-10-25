import type { CrmCompanyProfile, Prisma } from "@prisma/client";
import { setting } from "../../../config/setting";
import { crmCompanyProfileModel } from "../../../models/sales-crm/crm-company.model";
import { resolveEnvLogo } from "./company.logo";
import type { UpdateCompanyBody } from "./company.request";

export type CompanyLetterhead = {
  name: string;
  details: string;
  contactName: string;
  contactMobile: string;
  logoUrl: string;
};

export type CompanyProfileView = {
  saved: CompanyLetterhead;
  defaults: CompanyLetterhead;
  company: CompanyLetterhead;
};

export type CompanyProfileStore = {
  findOne(where: { isActive: number }): Promise<CrmCompanyProfile | null>;
  create(data: Prisma.CrmCompanyProfileUncheckedCreateInput): Promise<CrmCompanyProfile>;
  update(
    where: { id: string },
    data: Prisma.CrmCompanyProfileUncheckedUpdateInput,
  ): Promise<CrmCompanyProfile>;
};

export function envCompanyDefaults(): CompanyLetterhead {
  return {
    name: setting.company.name,
    details: setting.company.details,
    contactName: setting.company.contactName,
    contactMobile: setting.company.contactMobile,
    logoUrl: resolveEnvLogo(setting.company.logo),
  };
}

function letterheadFromRow(row: CrmCompanyProfile | null): CompanyLetterhead {
  return {
    name: row?.name ?? "",
    details: row?.details ?? "",
    contactName: row?.contactName ?? "",
    contactMobile: row?.contactMobile ?? "",
    logoUrl: row?.logoDataUrl ?? "",
  };
}

function mergeLetterhead(saved: CompanyLetterhead, defaults: CompanyLetterhead): CompanyLetterhead {
  return {
    name: saved.name.trim() || defaults.name,
    details: saved.details.trim() || defaults.details,
    contactName: saved.contactName.trim() || defaults.contactName,
    contactMobile: saved.contactMobile.trim() || defaults.contactMobile,
    logoUrl: saved.logoUrl || defaults.logoUrl,
  };
}

export class CompanyService {
  constructor(
    private readonly companies: CompanyProfileStore = crmCompanyProfileModel,
    private readonly loadDefaults: () => CompanyLetterhead = envCompanyDefaults,
  ) {}

  async get(): Promise<CompanyProfileView> {
    const saved = letterheadFromRow(await this.companies.findOne({ isActive: 1 }));
    const defaults = this.loadDefaults();
    return { saved, defaults, company: mergeLetterhead(saved, defaults) };
  }

  async update(actorId: string, input: UpdateCompanyBody): Promise<CompanyProfileView> {
    const existing = await this.companies.findOne({ isActive: 1 });
    const data: Prisma.CrmCompanyProfileUncheckedUpdateInput = {
      name: input.name,
      details: input.details,
      contactName: input.contactName,
      contactMobile: input.contactMobile,
      updatedBy: actorId,
    };
    if (input.logo !== undefined) {
      data.logoDataUrl = input.logo;
    }

    if (existing) {
      await this.companies.update({ id: existing.id }, data);
    } else {
      await this.companies.create({
        name: input.name,
        details: input.details,
        contactName: input.contactName,
        contactMobile: input.contactMobile,
        logoDataUrl: input.logo ?? null,
        createdBy: actorId,
        updatedBy: actorId,
      });
    }
    return this.get();
  }
}

export const companyService = new CompanyService();

import { Prisma, type Contact } from "@prisma/client";
import { prisma } from "../utils/prisma.util";
import { PrismaModel } from "./prisma-model";

export class ContactModel extends PrismaModel<
  Contact,
  Prisma.ContactUncheckedCreateInput,
  Prisma.ContactUncheckedUpdateInput,
  Prisma.ContactWhereInput,
  Prisma.ContactWhereUniqueInput,
  Prisma.ContactOrderByWithRelationInput
> {
  constructor() {
    super(prisma.contact, "Contact");
  }
}

export const contactModel = new ContactModel();

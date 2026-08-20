import { Prisma, type Otp } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PrismaModel } from "../prisma-model.js";

export class OtpModel extends PrismaModel<
  Otp,
  Prisma.OtpUncheckedCreateInput,
  Prisma.OtpUncheckedUpdateInput,
  Prisma.OtpWhereInput,
  Prisma.OtpWhereUniqueInput,
  Prisma.OtpOrderByWithRelationInput
> {
  protected override hidden = ["no"];

  constructor() {
    super(prisma.otp, "Otp");
  }
}

export const otpModel = new OtpModel();

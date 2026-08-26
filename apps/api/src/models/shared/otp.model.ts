import { Prisma, type Otp } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

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

  async countDistinctMobile(type: string): Promise<number> {
    const groups = await prisma.otp.groupBy({
      by: ["mobileNo"],
      where: { type },
    });
    return groups.length;
  }
}

export const otpModel = new OtpModel();

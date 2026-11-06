import { Prisma, type CheckIn } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class CheckInModel extends PrismaModel<
  CheckIn,
  Prisma.CheckInUncheckedCreateInput,
  Prisma.CheckInUncheckedUpdateInput,
  Prisma.CheckInWhereInput,
  Prisma.CheckInWhereUniqueInput,
  Prisma.CheckInOrderByWithRelationInput
> {
  constructor() {
    super(prisma.checkIn, "CheckIn");
  }
}

export const checkInModel = new CheckInModel();

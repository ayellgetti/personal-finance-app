import { Prisma, type Device } from "@prisma/client";
import { prisma } from "../../utils/prisma.util";
import { PrismaModel } from "../prisma-model";

export class DeviceModel extends PrismaModel<
  Device,
  Prisma.DeviceUncheckedCreateInput,
  Prisma.DeviceUncheckedUpdateInput,
  Prisma.DeviceWhereInput,
  Prisma.DeviceWhereUniqueInput,
  Prisma.DeviceOrderByWithRelationInput
> {
  constructor() {
    super(prisma.device, "Device");
  }
}

export const deviceModel = new DeviceModel();

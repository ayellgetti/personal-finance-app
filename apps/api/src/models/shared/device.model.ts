import { Prisma, type Device } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { PrismaModel } from "../prisma-model.js";

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

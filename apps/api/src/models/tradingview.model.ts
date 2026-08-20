import { Prisma, type Tradingview } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { PrismaModel } from "./prisma-model.js";

export class TradingviewModel extends PrismaModel<
  Tradingview,
  Prisma.TradingviewUncheckedCreateInput,
  Prisma.TradingviewUncheckedUpdateInput,
  Prisma.TradingviewWhereInput,
  Prisma.TradingviewWhereUniqueInput,
  Prisma.TradingviewOrderByWithRelationInput
> {
  constructor() {
    super(prisma.tradingview, "Tradingview");
  }
}

export const tradingviewModel = new TradingviewModel();

import { Prisma, type Tradingview } from "@prisma/client";
import { prisma } from "../utils/prisma.util";
import { PrismaModel } from "./prisma-model";

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

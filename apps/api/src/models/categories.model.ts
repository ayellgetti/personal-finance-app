import { Prisma, type Categories } from "@prisma/client";
import { prisma } from "../utils/prisma.util";
import { PrismaModel } from "./prisma-model";

export class CategoriesModel extends PrismaModel<
  Categories,
  Prisma.CategoriesUncheckedCreateInput,
  Prisma.CategoriesUncheckedUpdateInput,
  Prisma.CategoriesWhereInput,
  Prisma.CategoriesWhereUniqueInput,
  Prisma.CategoriesOrderByWithRelationInput
> {
  constructor() {
    super(prisma.categories, "Categories");
  }
}

export const categoriesModel = new CategoriesModel();

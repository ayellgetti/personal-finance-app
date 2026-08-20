import { Prisma, type Categories } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { PrismaModel } from "./prisma-model.js";

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

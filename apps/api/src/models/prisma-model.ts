import {
  Model,
  type PrismaModelDelegate,
} from "../utils/model.util";

export abstract class PrismaModel<
  TEntity,
  TCreate,
  TUpdate,
  TWhere,
  TWhereUnique,
  TOrderBy,
> extends Model<TEntity, TCreate, TUpdate, TWhere, TWhereUnique, TOrderBy> {
  protected constructor(delegate: unknown, name: string) {
    super(
      delegate as PrismaModelDelegate<
        TEntity,
        TCreate,
        TUpdate,
        TWhere,
        TWhereUnique,
        TOrderBy
      >,
      name,
    );
  }
}

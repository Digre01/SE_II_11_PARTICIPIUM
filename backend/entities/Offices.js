import { EntitySchema } from "typeorm";

export const Office = new EntitySchema({
  name: 'Offices',
  tableName: 'Offices',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: 'increment'
    },
    name: {
      type: String,
      nullable: false
    },
    isExternal: {
      type: Boolean,
      nullable: false,
      default: false
    }
  },
  relations: {
    userOffice: {
      type: 'one-to-many',
      target: 'UserOffice',
      inverseSide: 'office'
    },
    category: {
      type: 'one-to-one',
      target: 'Categories',
      inverseSide: 'office'
    }
  }
});

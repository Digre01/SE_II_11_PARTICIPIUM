import { EntitySchema } from "typeorm";

export const Categories = new EntitySchema({
  name: 'Categories',
  tableName: 'Categories',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: 'increment'
    },
    name: {
      type: Number,
      nullable: false
    },
    officeId: {
      type: Number,
      nullable: false
    }
  },
  relations: {
    reports: {
      type: 'one-to-many',
      target: 'Reports',
      inverseSide: 'category'
    },
    office: {
      type: 'one-to-one',
      target: 'Offices',
      joinColumn: { name: 'officeId' },
      inverseSide: 'category'
    }
  }
});

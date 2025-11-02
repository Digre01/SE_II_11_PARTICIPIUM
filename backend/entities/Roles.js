import { EntitySchema } from "typeorm";

export const Roles = new EntitySchema({
  name: 'Roles',
  tableName: 'Roles',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: 'increment'
    },
    name: {
      type: String,
      nullable: false
    }
  },
  relations: {
    userOffice: {
      type: 'one-to-many',
      target: 'UserOffice',
      inverseSide: 'role'
    }
  }
});

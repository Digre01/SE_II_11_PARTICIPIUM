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
    },
    officeId: {
      type: Number,
      nullable: false
    },
    officeIdExternal: {
      type: Number,
      nullable: true
    }
  },
  relations: {
    userOffice: {
      type: 'one-to-many',
      target: 'UserOffice',
      inverseSide: 'role'
    },
    office: {
      type: 'many-to-one',
      target: 'Offices',
      joinColumn: { name: 'officeId' },
      inverseSide: 'role'
    }
  }
});

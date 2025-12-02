import { EntitySchema } from "typeorm";

export const UserOffice = new EntitySchema({
  name: 'UserOffice',
  tableName: 'UserOffice',
  columns: {
    userId: {
      type: Number,
      primary: true
    },
    officeId: {
      type: Number,
      primary: true
    },
    roleId: {
      type: Number,
      nullable: true
    }
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'Users',
      joinColumn: { name: 'userId' },
      inverseSide: 'userOffice'
    },
    office: {
      type: 'many-to-one',
      target: 'Offices',
      joinColumn: { name: 'officeId' },
      inverseSide: 'userOffice'
    },
    role: {
      type: 'many-to-one',
      target: 'Roles',
      joinColumn: { name: 'roleId' },
      inverseSide: 'userOffice'
    }
  }
});

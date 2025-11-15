import { EntitySchema } from "typeorm";

export const Users = new EntitySchema({
  name: 'Users',
  tableName: 'Users',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: 'increment'
    },
    username: {
      type: String,
      nullable: false
    },
    email: {
      type: String,
      nullable: false
    },
    name: {
      type: String,
      nullable: false
    },
    surname: {
      type: String,
      nullable: false
    },
    telegramId: {
      type: String,
      nullable: true
    },
    photoId:{
      type: String,
      nullable: true
    },
    emailNotifications: {
      type: Boolean,
      nullable: false
    },
    password: {
      type: String,
      nullable: false
    },
    salt: {
      type: String,
      nullable: false
    },
    userType: {
      type: String,
      nullable: false
    },
    
  },
  relations: {
    reports: {
      type: 'one-to-many',
      target: 'Reports',
      inverseSide: 'user'
    },
    userOffice: {
      type: 'one-to-one',
      target: 'UserOffice',
      inverseSide: 'user'
    }
  }
});

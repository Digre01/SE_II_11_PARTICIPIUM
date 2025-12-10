import { EntitySchema } from "typeorm";

export const Report = new EntitySchema({
  name: 'Reports',
  tableName: 'Reports',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: 'increment'
    },
    title: {
      type: String,
      nullable: false
    },
    latitude: {
      type: 'double precision',
      nullable: false
    },
    longitude: {
      type: 'double precision',
      nullable: false
    },
    status: {
      type: String,
      nullable: false
    },
    description: {
      type: String,
      nullable: false
    },
    reject_explanation: {
      type: String,
      nullable: true
    },
    userId: {
      type: Number,
      nullable: false
    },
    categoryId: {
      type: Number,
      nullable: false
    },
    technicianId: {
      type: Number,
      nullable: true
    },
      assignedExternal: {
        type: Boolean,
        nullable: true,
      }
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'Users',
      joinColumn: { name: 'userId' },
      inverseSide: 'reports'
    },
    category: {
      type: 'many-to-one',
      target: 'Categories',
      joinColumn: { name: 'categoryId' },
      inverseSide: 'reports'
    },
    technician: {
      type: 'many-to-one',
      target: 'Users',
      joinColumn: { name: 'technicianId' },
      inverseSide: 'assignedReports'
    },
    photos: {
      type: 'one-to-many',
      target: 'Photos',
      inverseSide: 'report'
    }
  }
});
 
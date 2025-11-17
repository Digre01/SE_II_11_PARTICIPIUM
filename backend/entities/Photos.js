import { EntitySchema } from "typeorm";

export const Photos = new EntitySchema({
  name: 'Photos',
  tableName: 'Photos',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: 'increment'
    },
    link: {
      type: String,
      nullable: false
    },
    reportId: {
      type: Number,
      nullable: true
    }
  },
  relations: {
    report: {
      type: 'many-to-one',
      target: 'Reports',
      joinColumn: { name: 'reportId' },
      inverseSide: 'photos'
    }
  }
});
 
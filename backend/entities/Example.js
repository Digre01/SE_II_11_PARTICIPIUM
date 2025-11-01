import { EntitySchema } from "typeorm";

export const Queue = new EntitySchema({
  name: 'Names',
  tableName: 'names',
  columns: {
    id: {
      type: Number,          // int
      primary: true,
      generated: 'increment' //incremental ID
    },
    serviceId: {
      name: 'service_id',
      type: String,          // varchar
      length: 255,
      nullable: false,
      unique: false
    },
    ticket: {
      type: String,
      length: 255,
      nullable: false
    }
  }
});
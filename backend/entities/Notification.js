import { EntitySchema } from "typeorm";

export const Notification = new EntitySchema({
  name: "Notification",
  tableName: "Notification",
  columns: {
    id: { type: Number, primary: true, generated: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, createDate: true }
  },
  relations: {
    user: { type: "many-to-one", target: "Users", joinColumn: true },
    message: { type: "many-to-one", target: "Message", joinColumn: true }
  }
});

import { EntitySchema } from "typeorm";

export const Conversation = new EntitySchema({
  name: "Conversation",
  tableName: "Conversation",
  columns: {
    id: { type: Number, primary: true, generated: true },
    createdAt: { type: Date, createDate: true }
  },
  relations: {
    report: { type: "one-to-one", target: "Reports", joinColumn: true },
    messages: { type: "one-to-many", target: "Message", inverseSide: "conversation" }
  }
});

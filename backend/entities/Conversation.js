import { EntitySchema } from "typeorm";

export const Conversation = new EntitySchema({
  name: "Conversation",
  tableName: "Conversation",
  columns: {
    id: { type: Number, primary: true, generated: true },
    createdAt: { type: Date, createDate: true },
    isInternal: { type: Boolean, default: false, nullable: false }
  },
  relations: {
    report: { type: "many-to-one", target: "Reports", joinColumn: true },
    messages: { type: "one-to-many", target: "Message", inverseSide: "conversation" },
    participants: {
      type: "many-to-many",
      target: "Users",
      joinTable: true,
      inverseSide: "conversations"
    }
  }
});

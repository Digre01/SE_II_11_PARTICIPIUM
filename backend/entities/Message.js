import { EntitySchema } from "typeorm";

export const Message = new EntitySchema({
  name: "Message",
  tableName: "Message",
  columns: {
    id: { type: Number, primary: true, generated: true },
    content: { type: String },
    createdAt: { type: Date, createDate: true },
    isSystem: { type: Boolean, default: false }
  },
  relations: {
    conversation: { type: "many-to-one", target: "Conversation", joinColumn: true, inverseSide: "messages" },
    sender: { type: "many-to-one", target: "Users", joinColumn: true }
  }
});

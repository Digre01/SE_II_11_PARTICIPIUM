import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import {Users} from "../entities/Users.js";
import {Report} from "../entities/Reports.js";
import {UserOffice} from "../entities/UserOffice.js";
import {Categories} from "../entities/Categories.js";
import {Photos} from "../entities/Photos.js";
import {Office} from "../entities/Offices.js";
import {Roles} from "../entities/Roles.js";
import {Message} from "../entities/Message.js";
import {Conversation} from "../entities/Conversation.js";
import {Notification} from "../entities/Notification.js";

dotenv.config();

export const AppDataSourcePostgres = new DataSource({
  type: "postgres",
  host: process.env.PG_HOST || "localhost",
  port: Number.parseInt(process.env.PG_PORT) || 5432,
  username: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "postgres",
  database: process.env.PG_DB || "se_ii_db",
  entities: [Users, Report, UserOffice, Categories, Photos, Office, Roles, Message, Conversation, Notification],
  synchronize: true,
  // In test runs, drop schema to avoid sync conflicts with existing data
  dropSchema: process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID ? true : false,
  logging: false,
});

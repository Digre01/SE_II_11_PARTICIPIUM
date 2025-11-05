import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Categories } from "../entities/Categories.js";
import { Office as Offices } from "../entities/Offices.js";
import { Photos } from "../entities/Photos.js";
import { Report as Reports } from "../entities/Reports.js";
import { Roles } from "../entities/Roles.js";
import { UserOffice } from "../entities/UserOffice.js";
import { Users } from "../entities/Users.js";

dotenv.config();

export const AppDataSourcePostgres = new DataSource({
  type: "postgres",
  host: process.env.PG_HOST || "localhost",
  port: parseInt(process.env.PG_PORT) || 5432,
  username: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "postgres",
  database: process.env.PG_DB || "se_ii_db",
  entities: [Categories, Offices, Photos, Reports, Roles, UserOffice, Users],
  synchronize: true,
  logging: false,
});

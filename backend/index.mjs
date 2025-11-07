import dotenv from "dotenv";
import { AppDataSourcePostgres } from "./config/data-source.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;


AppDataSourcePostgres.initialize()
  .then(async () => {
    console.log("Database connected");

    // Seeding
    const { seedDatabase } = await import("./database/seeder.js");
    await seedDatabase();

    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error("Error in db connection: ", err));
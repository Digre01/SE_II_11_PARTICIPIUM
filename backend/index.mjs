import dotenv from "dotenv";
import { AppDataSourcePostgres } from "./config/data-source.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

AppDataSourcePostgres.initialize()
  .then(async () => {
    console.log("Database connected");
    /*
    // Svuota la tabella queue all'avvio (da togliere quando ci sarà la configurazione)
    const queueRepo = AppDataSourcePostgres.getRepository(Queue);
    await queueRepo.clear();
    console.log("Tabella queue svuotata");

    // Seeding dati tabella Service se vuota (da togliere quando ci sarà la configurazione)
    const serviceRepo = AppDataSourcePostgres.getRepository(Service);
    const existing = await serviceRepo.find();
    if (existing.length === 0) {
      await serviceRepo.save([
        { name: "Deposit money", avgTime: 10 },
        { name: "Send packages", avgTime: 15 },
        { name: "Withdraw money", avgTime: 20 }
      ]);
      console.log("Added default services");
    }*/

    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error("Error in db connection: ", err));
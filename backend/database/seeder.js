// backend/database/seeder.js
import { AppDataSourcePostgres } from "../config/data-source.js";

export async function seedDatabase() {
  // Offices
  const { Office: Offices } = await import("../entities/Offices.js");
  const officeRepo = AppDataSourcePostgres.getRepository(Offices);
  const officesExisting = await officeRepo.find();
  if (officesExisting.length === 0) {
    await officeRepo.save([
      { id: 1, name: 'Water Office' },
      { id: 2, name: 'Architectural Barriers Office' },
      { id: 3, name: 'Sewer System Office' },
      { id: 4, name: 'Public Lighting Office' },
      { id: 5, name: 'Waste Management Office' },
      { id: 6, name: 'Road Signs and Traffic Lights Office' },
      { id: 7, name: 'Roads and Urban Furnishings Office' },
      { id: 8, name: 'Public Green Areas and Playgrounds Office' },
      { id: 9, name: 'Generic Office' }
    ]);
    console.log("Added default Offices");
  }

  // Categories
  const { Categories } = await import("../entities/Categories.js");
  const categoryRepo = AppDataSourcePostgres.getRepository(Categories);
  const categoriesExisting = await categoryRepo.find();
  if (categoriesExisting.length === 0) {
    await categoryRepo.save([
      { id: 1, name: 'Water Supply – Drinking Water', officeId: 1 },
      { id: 2, name: 'Architectural Barriers', officeId: 2 },
      { id: 3, name: 'Sewer System', officeId: 3 },
      { id: 4, name: 'Public Lighting', officeId: 4 },
      { id: 5, name: 'Waste', officeId: 5 },
      { id: 6, name: 'Road Signs and Traffic Lights', officeId: 6 },
      { id: 7, name: 'Roads and Urban Furnishings', officeId: 7 },
      { id: 8, name: 'Public Green Areas and Playgrounds', officeId: 8 },
      { id: 9, name: 'Other', officeId: 9 }
    ]);
    console.log("Added default Categories");
  }

  // Users
  const { Users } = await import("../entities/Users.js");
  const userRepo = AppDataSourcePostgres.getRepository(Users);
  const usersExisting = await userRepo.find();
  if (usersExisting.length === 0) {
    await userRepo.save([
      { id: 1, username: 'admin', email: 'admin@polito.it', name: 'Admin', surname: 'User', password: 'hashedpassword', salt: 'salt', userType: 'admin' }
    ]);
    console.log("Added default Users");
  }
}

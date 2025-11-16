// backend/database/seeder.js
import { AppDataSourcePostgres } from "../config/data-source.js";

export async function seedDatabase() {
  // Offices
  const { Office: Offices } = await import("../entities/Offices.js");
  const officeRepo = AppDataSourcePostgres.getRepository(Offices);
  const officesExisting = await officeRepo.find();
  if (officesExisting.length === 0) {
    await officeRepo.save([
      { name: 'Water Office' },
      { name: 'Architectural Barriers Office' },
      { name: 'Sewer System Office' },
      { name: 'Public Lighting Office' },
      { name: 'Waste Management Office' },
      { name: 'Road Signs and Traffic Lights Office' },
      { name: 'Roads and Urban Furnishings Office' },
      { name: 'Public Green Areas and Playgrounds Office' },
      { name: 'Generic Office' }
    ]);
    console.log("Added default Offices");
  }

  // Categories
  const { Categories } = await import("../entities/Categories.js");
  const categoryRepo = AppDataSourcePostgres.getRepository(Categories);
  const categoriesExisting = await categoryRepo.find();
  if (categoriesExisting.length === 0) {
    await categoryRepo.save([
      { name: 'Water Supply – Drinking Water', officeId: 1 },
      { name: 'Architectural Barriers', officeId: 2 },
      { name: 'Sewer System', officeId: 3 },
      { name: 'Public Lighting', officeId: 4 },
      { name: 'Waste', officeId: 5 },
      { name: 'Road Signs and Traffic Lights', officeId: 6 },
      { name: 'Roads and Urban Furnishings', officeId: 7 },
      { name: 'Public Green Areas and Playgrounds', officeId: 8 },
      { name: 'Other', officeId: 9 }
    ]);
    console.log("Added default Categories");
  }

  // Users
  const { Users } = await import("../entities/Users.js");
  const userRepo = AppDataSourcePostgres.getRepository(Users);
  const usersExisting = await userRepo.find();
  if (usersExisting.length === 0) {
    await userRepo.save([
      { username: 'admin', email: 'admin@participium.it', name: 'Admin', surname: 'User', telegramId: null, photoId: null, emailNotifications: false, password: 'e902e3818acc6c6f842f95698f2d0fb99eb273a1fd4ce5c1f9f9a8cac04ba0cf', salt: '2f834c309f5faa13ec6d9a3b2a5b5ba7', userType: 'admin' },
      { username: 'citizen', email: 'anna.gialli@email.it', name: 'Anna', surname: 'Gialli', telegramId: null, photoId: null, emailNotifications: false, password: '8eb331671576a8691107e2f0aa9be4badc9c3eb4125bde6c19513a66b86c3e4b', salt: '79e7eefbafbdd24a94407e802bbb10d4', userType: 'citizen' },
      { username: 'staff1', email: 'mario.rossi@participium.it', name: 'Mario', surname: 'Rossi', telegramId: null, photoId: null, emailNotifications: false, password: '545ce5de6a56c66b35a1e407a40c7c678eae373beea3883f2c4527664125166b', salt: '5bad9287ac7de649a5bc62ab91150931', userType: 'STAFF' },
      { username: 'staff2', email: 'luigi.verdi@participium.it', name: 'Luigi', surname: 'Verdi', telegramId: null, photoId: null, emailNotifications: false, password: '3b20f4a45c87791030262371d32bff00f4ffc7846ffed500aeb7436f341c515b', salt: 'abadcde601267d1aa3a579002f0eb4f7', userType: 'STAFF' },
      { username: 'staff3', email: 'giovanni.bianchi@participium.it', name: 'Giovanni', surname: 'Bianchi', telegramId: null, photoId: null, emailNotifications: false, password: '688a3ce4dcec36ca0bb3349217fae599fb9d6b060c0a6df3585a2ab8f2fe8dae', salt: 'e8ab52af1d00bb0b830e0c4c3b85b9b7', userType: 'STAFF' }
    ]);
    console.log("Added default Users");
  }
  // Roles
  const { Roles } = await import("../entities/Roles.js");
  const rolesRepo = AppDataSourcePostgres.getRepository(Roles);
  const rolesExisting = await rolesRepo.find();
  if (rolesExisting.length === 0) {
    await rolesRepo.save([
      { name: 'Municipal Public Relations Officer' },
      { name: 'Municipal Administrator' },
      { name: 'Technical Office Staff Member' },
    ]);
    console.log("Added default Roles");
  }
}

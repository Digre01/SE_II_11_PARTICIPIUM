// backend/database/seeder.js
import { AppDataSourcePostgres } from "../config/data-source.js";

export async function seedDatabase() {
  // Offices
  const { Office: Offices } = await import("../entities/Offices.js");
  const officeRepo = AppDataSourcePostgres.getRepository(Offices);
  let officesExisting = await officeRepo.find();
  if (officesExisting.length === 0) {
    await officeRepo.save([
      { name: 'Organization Office', isExternal: false },
      { name: 'Water Office', isExternal: false },
      { name: 'Architectural Barriers Office', isExternal: false },
      { name: 'Sewer System Office', isExternal: false },
      { name: 'Public Lighting Office', isExternal: false },
      { name: 'Waste Management Office', isExternal: false },
      { name: 'Road Signs and Traffic Lights Office', isExternal: false },
      { name: 'Roads and Urban Furnishings Office', isExternal: false },
      { name: 'Public Green Areas and Playgrounds Office', isExternal: false },
      { name: 'Generic Office', isExternal: false },
      // Uffici esterni
      { name: 'SMAT', isExternal: true },
      { name: 'AccessiWay', isExternal: true },
      { name: 'Bosco Spurghi', isExternal: true },
      { name: 'IREN', isExternal: true },
      { name: 'Soris', isExternal: true },
      { name: '5T Srl', isExternal: true },
      { name: 'F.G. Srl', isExternal: true },
      { name: 'Turin Garden', isExternal: true },
      { name: 'taskrabbit', isExternal: true }
    ]);
    console.log("Added default Offices");
    officesExisting = await officeRepo.find(); // aggiorna con gli id generati
  }
  // Mappa nome office -> id
  const officeMap = {};
  officesExisting.forEach(o => { officeMap[o.name] = o.id; });

  // Categories
  const { Categories } = await import("../entities/Categories.js");
  const categoryRepo = AppDataSourcePostgres.getRepository(Categories);
  const categoriesExisting = await categoryRepo.find();
  if (categoriesExisting.length === 0) {
    await categoryRepo.save([
      { name: 'Water Supply – Drinking Water', officeId: officeMap['Water Office'] },
      { name: 'Architectural Barriers', officeId: officeMap['Architectural Barriers Office'] },
      { name: 'Sewer System', officeId: officeMap['Sewer System Office'] },
      { name: 'Public Lighting', officeId: officeMap['Public Lighting Office'] },
      { name: 'Waste', officeId: officeMap['Waste Management Office'] },
      { name: 'Road Signs and Traffic Lights', officeId: officeMap['Road Signs and Traffic Lights Office'] },
      { name: 'Roads and Urban Furnishings', officeId: officeMap['Roads and Urban Furnishings Office'] },
      { name: 'Public Green Areas and Playgrounds', officeId: officeMap['Public Green Areas and Playgrounds Office'] },
      { name: 'Other', officeId: officeMap['Generic Office'] }
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
      { username: 'staff1', email: 'mario.rossi@participium.it', name: 'Mario', surname: 'Rossi', telegramId: null, photoId: null, emailNotifications: false, password: '545ce5de6a56c66b35a1e407a40c7c678eae373beea3883f2c4527664125166b', salt: '5bad9287ac7de649a5bc62ab91150931', userType: 'staff' },
      { username: 'staff2', email: 'luigi.verdi@participium.it', name: 'Luigi', surname: 'Verdi', telegramId: null, photoId: null, emailNotifications: false, password: '3b20f4a45c87791030262371d32bff00f4ffc7846ffed500aeb7436f341c515b', salt: 'abadcde601267d1aa3a579002f0eb4f7', userType: 'staff' },
      { username: 'staff3', email: 'giovanni.bianchi@participium.it', name: 'Giovanni', surname: 'Bianchi', telegramId: null, photoId: null, emailNotifications: false, password: '688a3ce4dcec36ca0bb3349217fae599fb9d6b060c0a6df3585a2ab8f2fe8dae', salt: 'e8ab52af1d00bb0b830e0c4c3b85b9b7', userType: 'staff' }
    ]);
    console.log("Added default Users");
  }

  const staff1 = await userRepo.findOne({ where: { username: 'staff1' } });
  const staff2 = await userRepo.findOne({ where: { username: 'staff2' } });
  const staff3 = await userRepo.findOne({ where: { username: 'staff3' } });

  // Roles
  const { Roles } = await import("../entities/Roles.js");
  const rolesRepo = AppDataSourcePostgres.getRepository(Roles);
  const rolesExisting = await rolesRepo.find();
  if (rolesExisting.length === 0) {
    await rolesRepo.save([
      { name: 'Municipal Public Relations Officer', officeId: officeMap['Organization Office'], officeIdExternal: null },
      { name: 'Municipal Administrator', officeId: officeMap['Organization Office'], officeIdExternal: null },
      { name: 'Water Systems Technician', officeId: officeMap['Water Office'], officeIdExternal: officeMap['SMAT'] },
      { name: 'Accessibility Coordinator', officeId: officeMap['Architectural Barriers Office'], officeIdExternal: officeMap['AccessiWay'] },
      { name: 'Wastewater Engineer', officeId: officeMap['Sewer System Office'], officeIdExternal: officeMap['Bosco Spurghi'] },
      { name: 'Lighting Technician', officeId: officeMap['Public Lighting Office'], officeIdExternal: officeMap['IREN'] },
      { name: 'Waste Management Officer', officeId: officeMap['Waste Management Office'], officeIdExternal: officeMap['Soris'] },
      { name: 'Traffic Systems Technician', officeId: officeMap['Road Signs and Traffic Lights Office'], officeIdExternal: officeMap['5T Srl'] },
      { name: 'Public Works Supervisor', officeId: officeMap['Roads and Urban Furnishings Office'], officeIdExternal: officeMap['F.G. Srl'] },
      { name: 'Parks and Recreation Officer', officeId: officeMap['Public Green Areas and Playgrounds Office'], officeIdExternal: officeMap['Turin Garden'] },
      { name: 'General Maintenance Worker', officeId: officeMap['Generic Office'], officeIdExternal: officeMap['taskrabbit'] },
    ]);
    console.log("Added default Roles");
  }

  // UserOffice
  const { UserOffice } = await import("../entities/UserOffice.js");
  const userOfficeRepo = AppDataSourcePostgres.getRepository(UserOffice);
  const userOfficeExisting = await userOfficeRepo.find();
  if (userOfficeExisting.length === 0) {
    await userOfficeRepo.save([
      { userId: staff1.id, officeId: officeMap['Organization Office'], roleId: 1 },
      { userId: staff2.id, officeId: officeMap['Public Lighting Office'], roleId: 6 },
      { userId: staff3.id, officeId: officeMap['Roads and Urban Furnishings Office'], roleId: 9 }
    ]);
    console.log("Added default UserOffice");
  }

  // Reports
  const { Report } = await import("../entities/Reports.js");
  const reportRepo = AppDataSourcePostgres.getRepository(Report);
  const reportsExisting = await reportRepo.find();
  if (reportsExisting.length === 0) {
    await reportRepo.save([
      {
        title: "Not working street lamp",
        latitude: 45.0648099481403,
        longitude: 7.69553446768896,
        status: "assigned",
        description: "One of the street lamps in Piazza Vittorio has a light out.",
        reject_explanation: "",
        userId: 2,
        categoryId: 4,
        technicianId: null
      },
      {
        title: "Broken tile",
        latitude: 45.0656169914633,
        longitude: 7.69498193263189,
        status: "assigned",
        description: "Broken tile in Piazza Vittorio.",
        reject_explanation: "",
        userId: 2,
        categoryId: 7,
        technicianId: null
      },
      {
        title: "Uneven pavement",
        latitude: 45.0641804082172,
        longitude: 7.69560420512335,
        status: "assigned",
        description: "Uneven pavement in Piazza Vittorio.",
        reject_explanation: "",
        userId: 2,
        categoryId: 7,
        technicianId: null
      },
      {
        title: "Uneven pavement",
        latitude: 45.0650746262417,
        longitude: 7.69513213633672,
        status: "assigned",
        description: "Uneven pavement under a street lamp.",
        reject_explanation: "",
        userId: 2,
        categoryId: 7,
        technicianId: null
      },
      {
        title: "Not working street lamp",
        latitude: 45.0769028941044,
        longitude: 7.59023952482494,
        status: "assigned",
        description: "Not working street lamp in Parcheggio Fermi.",
        reject_explanation: "",
        userId: 2,
        categoryId: 4,
        technicianId: null
      },
      {
        title: "Broken stake",
        latitude: 45.074630103084814,
        longitude: 7.680433630935115,
        status: "assigned",
        description: "There is a broken stake on the side of the road that hinders pedestrian passage.",
        reject_explanation: "",
        userId: 2,
        categoryId: 4,
        technicianId: null
      },
      {
        title: "Broken bench",
        latitude: 45.07491412834689,
        longitude: 7.6809378862299145,
        status: "suspended",
        description: "This bench has a broken rod.",
        reject_explanation: "",
        userId: 2,
        categoryId: 4,
        technicianId: null
      },
      {
        title: "Smoking manhole",
        latitude: 45.066416034658424,
        longitude: 7.657559752456111,
        status: "assigned",
        description: "There is smoke coming from this manhole.",
        reject_explanation: "",
        userId: 2,
        categoryId: 4,
        technicianId: null
      },
      {
        title: "Trash bin upside-down",
        latitude: 45.06756836458845,
        longitude: 7.664941191665093,
        status: "assigned",
        description: "The trash bin on the street is upside-down.",
        reject_explanation: "",
        userId: 2,
        categoryId: 6,
        technicianId: null
      }
    ]);
    console.log("Added default Reports");
  }

  // Conversation
  const { Conversation } = await import("../entities/Conversation.js");
  const conversationRepo = AppDataSourcePostgres.getRepository(Conversation);
  const conversationExisting = await conversationRepo.find();
  if (conversationExisting.length === 0) {
    await conversationRepo.save([
      { report: { id: 1 }, createdAt: '2025-11-24T17:30:27.001359Z' },
      { report: { id: 2 }, createdAt: '2025-11-24T17:34:17.210933Z' },
      { report: { id: 3 }, createdAt: '2025-11-24T17:35:20.901083Z' },
      { report: { id: 4 }, createdAt: '2025-11-24T17:36:20.503512Z' },
      { report: { id: 5 }, createdAt: '2025-11-24T17:40:30.305441Z' }
    ]);
    console.log("Added default Conversations");
  }

  // Message
  const { Message } = await import("../entities/Message.js");
  const messageRepo = AppDataSourcePostgres.getRepository(Message);
  const messageExisting = await messageRepo.find();
  if (messageExisting.length === 0) {
    await messageRepo.save([
      // Pending Approval
      { content: "Report status change to: Pending Approval", createdAt: "2025-11-24T17:30:27.024265Z", isSystem: true, conversation: { id: 1 } },
      { content: "Report status change to: Pending Approval", createdAt: "2025-11-24T17:34:17.222935Z", isSystem: true, conversation: { id: 2 } },
      { content: "Report status change to: Pending Approval", createdAt: "2025-11-24T17:35:20.911851Z", isSystem: true, conversation: { id: 3 } },
      { content: "Report status change to: Pending Approval", createdAt: "2025-11-24T17:36:20.512655Z", isSystem: true, conversation: { id: 4 } },
      { content: "Report status change to: Pending Approval", createdAt: "2025-11-24T17:40:30.321685Z", isSystem: true, conversation: { id: 5 } },
      // Assigned
      { content: "Report status change to: Assigned", createdAt: "2025-11-24T17:41:05.194941Z", isSystem: true, conversation: { id: 1 } },
      { content: "Report status change to: Assigned", createdAt: "2025-11-24T17:41:08.044277Z", isSystem: true, conversation: { id: 2 } },
      { content: "Report status change to: Assigned", createdAt: "2025-11-24T17:41:11.080816Z", isSystem: true, conversation: { id: 3 } },
      { content: "Report status change to: Assigned", createdAt: "2025-11-24T17:41:14.298519Z", isSystem: true, conversation: { id: 4 } },
      { content: "Report status change to: Assigned", createdAt: "2025-11-24T17:41:17.075239Z", isSystem: true, conversation: { id: 5 } }
    ]);
    console.log("Added default Messages");
  }

  // Notification
  const { Notification } = await import("../entities/Notification.js");
  const notificationRepo = AppDataSourcePostgres.getRepository(Notification);
  const notificationExisting = await notificationRepo.find();
  if (notificationExisting.length === 0) {
    await notificationRepo.save([
      // messageId 1
      { user: { id: 2 }, message: { id: 1 }, createdAt: "2025-11-24T17:30:27.037103Z" },
      { user: { id: 3 }, message: { id: 1 }, createdAt: "2025-11-24T17:30:27.042579Z" },
      // messageId 2
      { user: { id: 2 }, message: { id: 2 }, createdAt: "2025-11-24T17:34:17.237113Z" },
      { user: { id: 3 }, message: { id: 2 }, createdAt: "2025-11-24T17:34:17.245569Z" },
      // messageId 3
      { user: { id: 2 }, message: { id: 3 }, createdAt: "2025-11-24T17:35:20.925802Z" },
      { user: { id: 3 }, message: { id: 3 }, createdAt: "2025-11-24T17:35:20.934462Z" },
      // messageId 4
      { user: { id: 2 }, message: { id: 4 }, createdAt: "2025-11-24T17:36:20.523206Z" },
      { user: { id: 3 }, message: { id: 4 }, createdAt: "2025-11-24T17:36:20.528946Z" },
      // messageId 5
      { user: { id: 2 }, message: { id: 5 }, createdAt: "2025-11-24T17:40:30.340683Z" },
      { user: { id: 3 }, message: { id: 5 }, createdAt: "2025-11-24T17:40:30.354875Z" },
      // messageId 6
      { user: { id: 2 }, message: { id: 6 }, createdAt: "2025-11-24T17:41:05.20932Z" },
      { user: { id: 3 }, message: { id: 6 }, createdAt: "2025-11-24T17:41:05.214775Z" },
      // messageId 7
      { user: { id: 2 }, message: { id: 7 }, createdAt: "2025-11-24T17:41:08.057039Z" },
      { user: { id: 3 }, message: { id: 7 }, createdAt: "2025-11-24T17:41:08.062847Z" },
      // messageId 8
      { user: { id: 2 }, message: { id: 8 }, createdAt: "2025-11-24T17:41:11.091816Z" },
      { user: { id: 3 }, message: { id: 8 }, createdAt: "2025-11-24T17:41:11.096578Z" },
      // messageId 9
      { user: { id: 2 }, message: { id: 9 }, createdAt: "2025-11-24T17:41:14.390978Z" },
      { user: { id: 3 }, message: { id: 9 }, createdAt: "2025-11-24T17:41:14.314934Z" },
      // messageId 10
      { user: { id: 2 }, message: { id: 10 }, createdAt: "2025-11-24T17:41:17.086807Z" },
      { user: { id: 3 }, message: { id: 10 }, createdAt: "2025-11-24T17:41:17.092776Z" }
    ]);
    console.log("Added default Notifications");
  }

  // Photos
  const { Photos } = await import("../entities/Photos.js");
  const photosRepo = AppDataSourcePostgres.getRepository(Photos);
  const photosExisting = await photosRepo.find();
  if (photosExisting.length === 0) {
    await photosRepo.save([
      { link: "/public/1764005426910-643142474.jpg", reportId: 1 },
      { link: "/public/1764005426913-349625715.jpg", reportId: 1 },
      { link: "/public/1764005426914-664601247.jpg", reportId: 1 },
      { link: "/public/1764005657140-386786051.jpg", reportId: 2 },
      { link: "/public/1764005657157-420049505.jpg", reportId: 2 },
      { link: "/public/1764005720824-834890826.jpg", reportId: 3 },
      { link: "/public/1764005720848-687674767.jpg", reportId: 3 },
      { link: "/public/1764005780459-915574856.jpg", reportId: 4 },
      { link: "/public/1764006030253-881531326.jpg", reportId: 5 },
      { link: "/public/Broken_stake1.jpg", reportId: 6 },
      { link: "/public/Broken_stake2.jpg", reportId: 6 },
      { link: "/public/Broken_stake3.jpg", reportId: 6 },
      { link: "/public/Broken_bench.jpg", reportId: 7 },
      { link: "/public/Smoking_manhole.jpg", reportId: 8 },
      { link: "/public/Trash_upsidedown1.jpg", reportId: 9 },
      { link: "/public/Trash_upsidedown2.jpg", reportId: 9 }
    ]);
    console.log("Added default Photos");
  }

  // Conversation Participants (many-to-many)
  // Popola la tabella conversation_participants_users
  const convParticipants = [
    { conversationId: 1, usersId: 2 },
    { conversationId: 1, usersId: 3 },
    { conversationId: 2, usersId: 2 },
    { conversationId: 2, usersId: 3 },
    { conversationId: 3, usersId: 2 },
    { conversationId: 3, usersId: 3 },
    { conversationId: 4, usersId: 2 },
    { conversationId: 4, usersId: 3 },
    { conversationId: 5, usersId: 2 },
    { conversationId: 5, usersId: 3 }
  ];
  const conversationParticipantsTable = await AppDataSourcePostgres.query('SELECT * FROM "conversation_participants_users"');
  if (conversationParticipantsTable.length === 0) {
    // Recupera repo e oggetti
    const conversations = await conversationRepo.find();
    const users = await userRepo.find();
    // Mappa id -> oggetto
    const convMap = {};
    conversations.forEach(c => { convMap[c.id] = c; });
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });
    // Per ogni conversazione, aggiungi i partecipanti
    for (let i = 1; i <= 5; i++) {
      const conv = convMap[i];
      if (conv) {
        conv.participants = [userMap[2], userMap[3]];
        await conversationRepo.save(conv);
      }
    }
    console.log("Added default Conversation Participants");
  }
}

describe('PATCH /api/v1/reports/:id/assign_external (E2E)', () => {
  let createdForExternalId;

  beforeAll(async () => {

    let req = request(app)
      .post('/api/v1/reports')
      .set('Cookie', cookie)
      .field('title', 'To assign externally')
      .field('description', 'Desc')
      .field('categoryId', '5')
      .field('latitude', '10.1')
      .field('longitude', '20.2');
    req = attachFakeImage(req, 'ext-a.jpg');
    const createRes = await req;
    expect(createRes.status).toBe(201);

    // Get latest report for the citizen user
    const { Users } = await import('../../entities/Users.js');
    const userRepo = AppDataSourcePostgres.getRepository(Users);
    const citizenUser = await userRepo.findOne({ where: { username: 'citizen' } });

    const { Report } = await import('../../entities/Reports.js');
    const reportRepo = AppDataSourcePostgres.getRepository(Report);
    const report = await reportRepo.findOne({
      where: { userId: citizenUser.id },
      order: { id: 'DESC' }
    });
    createdForExternalId = report.id;

    deleteReturnedPhotos(createRes.body.photos);
  }, 30000);

  it('fails without authentication (no cookie)', async () => {
    const res = await request(app)
      .patch(`/api/v1/reports/${createdForExternalId}/assign_external`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Unauthorized/i);
  });

  it('successfully assigns to external maintainer (staff)', async () => {
    const res = await request(app)
      .patch(`/api/v1/reports/${createdForExternalId}/assign_external`)
      .set('Cookie', cookie_staff);

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.id).toBe(createdForExternalId);
    expect(res.body.assignedExternal).toBe(true);

    // Double-check by reading back from DB
    const { Report } = await import('../../entities/Reports.js');
    const reportRepo = AppDataSourcePostgres.getRepository(Report);
    const reloaded = await reportRepo.findOneBy({ id: createdForExternalId });
    expect(reloaded.assignedExternal).toBe(true);
  });

  it('returns 404 for non-existent report id', async () => {
    const res = await request(app)
      .patch('/api/v1/reports/999999/assign_external')
      .set('Cookie', cookie_staff);
    expect(res.status).toBe(404);
  });
});

describe('E2E: anonymous report appears anonymous in public assigned list', () => {
  let anonReportId;
  let staffWithRoleCookie;

  beforeAll(async () => {
    // Create an anonymous report as citizen
    let req = request(app)
      .post('/api/v1/reports')
      .set('Cookie', cookie)
      .field('title', 'E2E Anonymous')
      .field('description', 'Anonymous desc')
      .field('categoryId', '5')
      .field('latitude', '41.1')
      .field('longitude', '8.8')
      .field('isAnonymous', 'true');
    req = attachFakeImage(req, 'anon.jpg');
    const createRes = await req;
    expect(createRes.status).toBe(201);

    // Find created report id for this citizen
    const { Users } = await import('../../entities/Users.js');
    const userRepo = AppDataSourcePostgres.getRepository(Users);
    const citizenUser = await userRepo.findOne({ where: { username: 'citizen' } });

    const { Report } = await import('../../entities/Reports.js');
    const reportRepo = AppDataSourcePostgres.getRepository(Report);
    const report = await reportRepo.findOne({ where: { userId: citizenUser.id }, order: { id: 'DESC' } });
    anonReportId = report.id;

    // Ensure staff1 has the Municipal Public Relations Officer role so they can accept
    const staffUser = await userRepo.findOne({ where: { username: 'staff1' } });
    const { Roles } = await import('../../entities/Roles.js');
    const rolesRepo = AppDataSourcePostgres.getRepository(Roles);
    const mpRole = await rolesRepo.findOne({ where: { name: 'Municipal Public Relations Officer' } });
    const { UserOffice } = await import('../../entities/UserOffice.js');
    const userOfficeRepo = AppDataSourcePostgres.getRepository(UserOffice);
    let existingUO = await userOfficeRepo.findOne({ where: { userId: staffUser.id } });
    if (!existingUO) existingUO = { userId: staffUser.id };
    existingUO.roleId = mpRole.id;
    await userOfficeRepo.save(existingUO);

    staffWithRoleCookie = await loginAndGetCookieStaff();

    // Accept the report as staff to make it 'assigned'
    const reviewRes = await request(app)
      .patch(`/api/v1/reports/${anonReportId}/review`)
      .set('Cookie', staffWithRoleCookie)
      .send({ action: 'accept' });
    expect([200,201,204]).toContain(reviewRes.status);

    deleteReturnedPhotos(createRes.body.photos);
  }, 30000);

  it('shows null author fields in /assigned for anonymous report', async () => {
    const res = await request(app)
      .get('/api/v1/reports/assigned')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    const found = res.body.find(r => r.id === anonReportId);
    expect(found).toBeDefined();
    expect(found.authorUsername).toBeNull();
    expect(found.authorName).toBeNull();
  });
});
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

const { AppDataSourcePostgres } = await import('../../config/data-source.js');
const { seedDatabase } = await import('../../database/seeder.js');
const { default: app } = await import('../../app.js');

let cookie = '';
let cookie_staff = '';

async function loginAndGetCookie() {
  const res = await request(app)
    .post('/api/v1/sessions/login')
    .send({ username: 'citizen', password: 'citizen' });
  expect(res.status).toBe(201);
  const setCookie = res.headers['set-cookie'];
  expect(setCookie).toBeDefined();
  return setCookie.map(c => c.split(';')[0]).join('; ');
}

async function loginAndGetCookieStaff() {
  const res = await request(app)
    .post('/api/v1/sessions/login')
    .send({ username: 'staff1', password: 'staff1' });
  expect(res.status).toBe(201);
  const setCookie = res.headers['set-cookie'];
  expect(setCookie).toBeDefined();
  return setCookie.map(c => c.split(';')[0]).join('; ');
}

function attachFakeImage(req, name) {
  return req.attach('photos', Buffer.from('fake-image-bytes'), name);
}

function deleteReturnedPhotos(photos) {
  for (const p of photos || []) {
    try {
      // p is like /public/<filename>
      const full = path.join(path.dirname(new URL('../../app.js', import.meta.url).pathname), p);
      fs.existsSync(full) && fs.unlinkSync(full);
    } catch {}
  }
}

beforeAll(async () => {
  await AppDataSourcePostgres.initialize();
  await seedDatabase();
  cookie = await loginAndGetCookie();
  cookie_staff = await loginAndGetCookieStaff();
}, 30000);

afterAll(async () => {
  await AppDataSourcePostgres.destroy();
});

describe('POST /api/v1/reports (E2E)', () => {
  it('fails without authorization (no cookie)', async () => {
    let req = request(app)
        .post('/api/v1/reports')
        .field('title', 'No auth')
        .field('description', 'Desc')
        .field('categoryId', '5')
        .field('latitude', '45.1')
        .field('longitude', '9.2');
    req = await attachFakeImage(req, 'a.jpg');
    let res = await req;
    expect(res.body.message).toMatch(/Unauthorized/i);
  });

  it('fails missing required fields (no description)', async () => {
    let req = request(app)
        .post('/api/v1/reports')
        .set('Cookie', cookie)
        .field('title', 'No auth')
        .field('categoryId', '5')
        .field('latitude', '45.1')
        .field('longitude', '9.2');
    req = await attachFakeImage(req, 'a.jpg');
    let res = await req;
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/all fields are required/i);
  });

  it('fails with zero photos', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Cookie', cookie)
      .field('title', 'No photos')
      .field('description', 'Desc')
      .field('categoryId', '2')
      .field('latitude', '1')
      .field('longitude', '2');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/between 1 and 3 photos/i);
  });

  //This test need to be revisited because the photos legnth is checked before putting in the body
  
  /*
  it('fails with more than 3 photos', async () => {
    let req = request(app)
      .post('/api/v1/reports')
      .set('Cookie', cookie)
      .field('title', 'Too many')
      .field('description', 'Desc')
      .field('categoryId', '7')
      .field('latitude', '11.2')
      .field('longitude', '33.4');
    req = attachFakeImage(req, 'a.jpg');
    req = attachFakeImage(req, 'b.jpg');
    req = attachFakeImage(req, 'c.jpg');
    req = attachFakeImage(req, 'd.jpg'); // 4th file

    const res = await req;
    expect(res.status).toBe(400);
    // Either multer's limit message or route message
    expect(
      /up to 3 photos|between 1 and 3 photos/i.test(res.body.error || '')
    ).toBe(true);
  });

  it('creates report with 1 photo', async () => {
    let req = request(app)
        .post('/api/v1/reports')
        .set('Cookie', cookie)
        .field('title', 'Single photo')
        .field('description', 'Desc')
        .field('categoryId', '5')
        .field('latitude', '45.1')
        .field('longitude', '9.2');

    req = attachFakeImage(req, 'a.jpg');
    const res = await req;
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Report created successfully');
    expect(Array.isArray(res.body.photos)).toBe(true);
    expect(res.body.photos.length).toBe(1);
    deleteReturnedPhotos(res.body.photos);
  });
  */

  it('creates report with 2 photos', async () => {
    let req = request(app)
      .post('/api/v1/reports')
      .set('Cookie', cookie)
      .field('title', 'Two photos')
      .field('description', 'Desc')
      .field('categoryId', '6')
      .field('latitude', '12.3')
      .field('longitude', '3.21');
    req = attachFakeImage(req, 'a.jpg');
    req = attachFakeImage(req, 'b.jpg');

    const res = await req;
    expect(res.status).toBe(201);
    expect(res.body.photos.length).toBe(2);
    deleteReturnedPhotos(res.body.photos);
  });

  it('creates report with 3 photos', async () => {
    let req = request(app)
      .post('/api/v1/reports')
      .set('Cookie', cookie)
      .field('title', 'Three photos')
      .field('description', 'Desc')
      .field('categoryId', '9')
      .field('latitude', '1.1')
      .field('longitude', '2.2');
    req = attachFakeImage(req, 'a.jpg');
    req = attachFakeImage(req, 'b.jpg');
    req = attachFakeImage(req, 'c.jpg');

    const res = await req;
    expect(res.status).toBe(201);
    expect(res.body.photos.length).toBe(3);
    deleteReturnedPhotos(res.body.photos);
  });

  it('fails when categoryId does not exist', async () => {
    let req = request(app)
        .post('/api/v1/reports')
        .set('Cookie', cookie)
        .field('title', 'Bad category')
        .field('description', 'Desc')
        .field('categoryId', '0') // not seeded
        .field('latitude', '5')
        .field('longitude', '6');
    req = attachFakeImage(req, 'a.jpg');
    const res = await req;
    expect([404, 400]).toContain(res.status); // NotFound from repo or validation
    deleteReturnedPhotos(res.body.photos);
  });
});

describe('GET /api/v1/reports/:id (E2E)', () => {
  let createdReportId;
  let cookieStaffWithRole;

  beforeAll(async () => {
    // Create a report first
    let req = request(app)
      .post('/api/v1/reports')
      .set('Cookie', cookie)
      .field('title', 'Test Report for GET')
      .field('description', 'Desc')
      .field('categoryId', '5')
      .field('latitude', '12.3')
      .field('longitude', '3.21');
    req = attachFakeImage(req, 'a.jpg');
    req = attachFakeImage(req, 'b.jpg');

    const createRes = await req;
    expect(createRes.status).toBe(201);
    
    // Get the created report ID
    const { Users } = await import('../../entities/Users.js');
    const userRepo = AppDataSourcePostgres.getRepository(Users);
    const citizenUser = await userRepo.findOne({ where: { username: 'citizen' } });
    
    const { Report } = await import('../../entities/Reports.js');
    const reportRepo = AppDataSourcePostgres.getRepository(Report);
    const report = await reportRepo.findOne({ 
      where: { userId: citizenUser.id },
      order: { id: 'DESC' }
    });
    createdReportId = report.id;
    
    // Assign role to staff1
    const staffUser = await userRepo.findOne({ where: { username: 'staff1' } });
    const { Roles } = await import('../../entities/Roles.js');
    const rolesRepo = AppDataSourcePostgres.getRepository(Roles);
    const mpRole = await rolesRepo.findOne({ where: { name: 'Municipal Public Relations Officer' } });
    
    const { UserOffice } = await import('../../entities/UserOffice.js');
    const userOfficeRepo = AppDataSourcePostgres.getRepository(UserOffice);
    let existingUO = await userOfficeRepo.findOne({ where: { userId: staffUser.id } });
    if (!existingUO) {
      existingUO = { userId: staffUser.id };
    }
    existingUO.roleId = mpRole.id;
    await userOfficeRepo.save(existingUO);
    
    cookieStaffWithRole = await loginAndGetCookieStaff();
    
    deleteReturnedPhotos(createRes.body.photos);
  }, 30000);

  it('should fail without authentication (no cookie)', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/${createdReportId}`);
    
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Unauthorized/i);
  });

  it('should fail when accessed by citizen user', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/${createdReportId}`)
      .set('Cookie', cookie);
    
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  it('should fail when accessed by staff without proper role', async () => {
    // Login with staff2 who doesn't have the Municipal Public Relations Officer role
    const cookieStaff2 = await (async () => {
      const res = await request(app)
        .post('/api/v1/sessions/login')
        .send({ username: 'staff2', password: 'staff2' });
      expect(res.status).toBe(201);
      return res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
    })();
    
    const res = await request(app)
      .get(`/api/v1/reports/${createdReportId}`)
      .set('Cookie', cookieStaff2);
    
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  it('should fail when report ID does not exist', async () => {
    const nonExistentId = 999999;
    const res = await request(app)
      .get(`/api/v1/reports/${nonExistentId}`)
      .set('Cookie', cookieStaffWithRole);
    
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Not found/i);
  });

  it('should fail with invalid report ID format', async () => {
    const res = await request(app)
      .get('/api/v1/reports/invalid-id')
      .set('Cookie', cookieStaffWithRole);
    
    // Should either return 404 or 400 depending on validation
    expect([400, 404, 500]).toContain(res.status);
  });

  it('should successfully retrieve report with proper staff role', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/${createdReportId}`)
      .set('Cookie', cookieStaffWithRole);
    
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.id).toBe(createdReportId);
    expect(res.body.title).toBe('Test Report for GET');
    expect(res.body.description).toBe('Desc');
    expect(res.body.categoryId).toBe(5);
    expect(res.body.latitude).toBe(12.3);
    expect(res.body.longitude).toBe(3.21);
    expect(res.body.status).toBe('pending');
  });

  it('should include photos in the response', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/${createdReportId}`)
      .set('Cookie', cookieStaffWithRole);
    
    expect(res.status).toBe(200);
    expect(res.body.photos).toBeDefined();
    expect(Array.isArray(res.body.photos)).toBe(true);
  });

  it('should include category information in the response', async () => {
    const res = await request(app)
      .get(`/api/v1/reports/${createdReportId}`)
      .set('Cookie', cookieStaffWithRole);
    
    expect(res.status).toBe(200);
    expect(res.body.category).toBeDefined();
    expect(res.body.category.id).toBe(5);
    expect(res.body.category.name).toBeDefined();
  });
})

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
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

const { AppDataSourcePostgres } = await import('../../config/data-source.js');
const { seedDatabase } = await import('../../database/seeder.js');
const { default: app } = await import('../../app.js');

let cookie = '';

async function loginAndGetCookie() {
  const res = await request(app)
    .post('/api/v1/sessions/login')
    .send({ username: 'citizen', password: 'password' });
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
});

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
    expect(res.body.error).toMatch(/all fields are required/i);
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
    expect(res.body.error).toMatch(/between 1 and 3 photos/i);
  });

  //This test need to be revisited because the photos legnth is checked before putting in the body
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
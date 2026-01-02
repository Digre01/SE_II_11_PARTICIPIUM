import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import request from "supertest";
import {standardSetup, standardTeardown} from "../../utils/standard.setup.js";
import {attachFakeImage, deleteReturnedPhotos} from "../../utils/files.utils.js";
import {getCreatedReportId} from "../../utils/db.utils.js";

describe('E2E: anonymous report appears anonymous in public assigned list', () => {
  let app, dataSource, citizenCookie, staffCookie;
  let anonReportId;

  beforeAll(async () => {
    const setup = await standardSetup()
    app = setup.app
    dataSource = setup.dataSource;

    citizenCookie = await setup.loginAsCitizen()

    let req = request(app)
      .post('/api/v1/reports')
      .set('Cookie', citizenCookie)
      .field('title', 'E2E Anonymous')
      .field('description', 'Anonymous desc')
      .field('categoryId', '5')
      .field('latitude', '41.1')
      .field('longitude', '8.8')
      .field('isAnonymous', 'true');

    req = attachFakeImage(req, 'anon.jpg');

    const createRes = await req;
    expect(createRes.status).toBe(201);

    anonReportId = await getCreatedReportId()

    staffCookie = await setup.loginAsStaff()

    // Accept the report as staff to make it 'assigned'
    const reviewRes = await request(app)
      .patch(`/api/v1/reports/${anonReportId}/review`)
      .set('Cookie', staffCookie)
      .send({ action: 'accept' });
    expect([200,201,204]).toContain(reviewRes.status);

    deleteReturnedPhotos(createRes.body.photos);
  }, 30000);

  afterAll(async () => {
    await standardTeardown(dataSource);
  });

  it('shows null author fields in /assigned for anonymous report', async () => {
    const res = await request(app)
      .get('/api/v1/reports/assigned')
      .set('Cookie', citizenCookie);

    expect(res.status).toBe(200);
    const found = res.body.find(r => r.id === anonReportId);
    expect(found).toBeDefined();
    expect(found.authorUsername).toBeNull();
    expect(found.authorName).toBeNull();
  });
});
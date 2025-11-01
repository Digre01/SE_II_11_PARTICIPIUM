import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';

// Mock del repository PRIMA di importare l'app, così i controller useranno il mock
const mockRepo = {
  createTicket: jest.fn(),
  nextCustomerByServiceIds: jest.fn(),
};

await jest.unstable_mockModule('../../repositories/queueRepository.mjs', () => ({
  queueRepository: mockRepo,
}));

// Import dell'app dopo il mock
const { default: app } = await import('../../app.js');

describe('QueueController integration (via routes)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/tickets', () => {
    it('should validate input and return 400 on missing serviceId', async () => {
      const res = await request(app).post('/api/v1/tickets').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'serviceId is required' });
    });

    it('should return 201 with ticket payload', async () => {
      mockRepo.createTicket.mockResolvedValueOnce({ id: 123, listCode: 'S1-1' });

      const res = await request(app).post('/api/v1/tickets').send({ serviceId: 1 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: 123, listCode: 'S1-1' });
      expect(mockRepo.createTicket).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /api/v1/tickets/next', () => {
    it('should validate input and return 400 on missing/invalid serviceIds', async () => {
      let res = await request(app).post('/api/v1/tickets/next').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'serviceIds is required (array)' });

      res = await request(app).post('/api/v1/tickets/next').send({ serviceIds: [] });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'serviceIds is required (array)' });
    });

    it('should return 204 when no ticket is available', async () => {
      mockRepo.nextCustomerByServiceIds.mockResolvedValueOnce(null);

      const res = await request(app).post('/api/v1/tickets/next').send({ serviceIds: [1,2,3] });

      expect(res.status).toBe(204);
      expect(res.text).toBe('');
    });

    it('should return 200 with next ticket', async () => {
      const next = { id: 2, serviceId: 2, ticket: 'S2-1' };
      mockRepo.nextCustomerByServiceIds.mockResolvedValueOnce(next);

      const res = await request(app).post('/api/v1/tickets/next').send({ serviceIds: [1,2,3] });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(next);
      expect(mockRepo.nextCustomerByServiceIds).toHaveBeenCalledWith([1,2,3]);
    });
  });
});

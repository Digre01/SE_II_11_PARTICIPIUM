// backend/test/unit/multerErrorHandler.unit.test.js
import { describe, it, expect, jest } from "@jest/globals";
import multerErrorHandler from '../../middlewares/multerErrorHandler.js';

function createMockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('multerErrorHandler', () => {
  it('handles LIMIT_FILE_SIZE', () => {
    const err = { name: 'MulterError', code: 'LIMIT_FILE_SIZE' };
    const req = {}, res = createMockRes(), next = jest.fn();
    multerErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Too large file: maximum 2MB per file.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('handles LIMIT_FILE_COUNT', () => {
    const err = { name: 'MulterError', code: 'LIMIT_FILE_COUNT' };
    const req = {}, res = createMockRes(), next = jest.fn();
    multerErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'You can upload up to 3 photos.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('handles LIMIT_UNEXPECTED_FILE', () => {
    const err = { name: 'MulterError', code: 'LIMIT_UNEXPECTED_FILE' };
    const req = {}, res = createMockRes(), next = jest.fn();
    multerErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Too many files or invalid field.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('handles generic MulterError', () => {
    const err = { name: 'MulterError', code: 'OTHER' };
    const req = {}, res = createMockRes(), next = jest.fn();
    multerErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Upload error' });
    expect(next).not.toHaveBeenCalled();
  });

  it('handles only image files error', () => {
    const err = { message: 'Only image files are allowed!' };
    const req = {}, res = createMockRes(), next = jest.fn();
    multerErrorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Only image files are allowed.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for other errors', () => {
    const err = { message: 'Other error' };
    const req = {}, res = createMockRes(), next = jest.fn();
    multerErrorHandler(err, req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

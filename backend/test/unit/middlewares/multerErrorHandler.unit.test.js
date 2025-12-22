import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRes, createMockReq, createMockNext } from '../mocks/test-utils.mocks.js';
import multerErrorHandler from '../../../middlewares/multerErrorHandler.js';

describe('multerErrorHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
  });

  it('handles LIMIT_FILE_SIZE', () => {
    const err = { name: 'MulterError', code: 'LIMIT_FILE_SIZE' };

    multerErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Too large file: maximum 2MB per file.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('handles LIMIT_FILE_COUNT', () => {
    const err = { name: 'MulterError', code: 'LIMIT_FILE_COUNT' };

    multerErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'You can upload up to 3 photos.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('handles LIMIT_UNEXPECTED_FILE', () => {
    const err = { name: 'MulterError', code: 'LIMIT_UNEXPECTED_FILE' };

    multerErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Too many files or invalid field.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('handles generic MulterError', () => {
    const err = { name: 'MulterError', code: 'OTHER' };

    multerErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Upload error' });
    expect(next).not.toHaveBeenCalled();
  });

  it('handles only image files error', () => {
    const err = { message: 'Only image files are allowed!' };

    multerErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Only image files are allowed.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for other errors', () => {
    const err = { message: 'Other error' };

    multerErrorHandler(err, req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  createMockRes,
  createMockReq,
  createMockNext
} from '../mocks/test-utils.mocks.js';
import multerErrorHandler from '../../../middlewares/multerErrorHandler.js';

describe('multerErrorHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = createMockNext();
  });

  it.each([
    [
      'LIMIT_FILE_SIZE',
      { name: 'MulterError', code: 'LIMIT_FILE_SIZE' },
      'Too large file: maximum 2MB per file.'
    ],
    [
      'LIMIT_FILE_COUNT',
      { name: 'MulterError', code: 'LIMIT_FILE_COUNT' },
      'You can upload up to 3 photos.'
    ],
    [
      'LIMIT_UNEXPECTED_FILE',
      { name: 'MulterError', code: 'LIMIT_UNEXPECTED_FILE' },
      'Too many files or invalid field.'
    ],
    [
      'generic MulterError',
      { name: 'MulterError', code: 'OTHER' },
      'Upload error'
    ],
    [
      'only image files error',
      { message: 'Only image files are allowed!' },
      'Only image files are allowed.'
    ]
  ])('handles %s', (_, err, expectedMessage) => {
    multerErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expectedMessage });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for other errors', () => {
    const err = { message: 'Other error' };

    multerErrorHandler(err, req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

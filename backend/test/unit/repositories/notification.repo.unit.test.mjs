import { describe, it, expect, beforeEach, jest, beforeAll } from '@jest/globals';
import { notificationRepoStub } from "../mocks/repo.stubs.js";

let createNotification;
let getUnreadNotifications;
let markNotificationsAsReadForConversation;
let getUnreadCountByConversation;

let fakeNotification;
let mockNotifications;

beforeAll(async () => {
  const repo = await import('../../../repositories/notificationRepository.js');
  createNotification = repo.createNotification;
  getUnreadNotifications = repo.getUnreadNotifications;
  markNotificationsAsReadForConversation = repo.markNotificationsAsReadForConversation;
  getUnreadCountByConversation = repo.getUnreadCountByConversation;
});

beforeEach(() => {
  jest.clearAllMocks();

  // Default notification mock
  fakeNotification = { id: 77, user: { id: 5 }, message: { id: 9 } };
  notificationRepoStub.create.mockReturnValue({ user: { id: 5 }, message: { id: 9 } });
  notificationRepoStub.save.mockResolvedValue(fakeNotification);

  mockNotifications = [
    { id: 1, read: false, message: { id: 11, conversation: { id: 100 } } },
    { id: 2, read: false, message: { id: 12, conversation: { id: 101 } } }
  ];
  notificationRepoStub.find.mockResolvedValue(mockNotifications);
});

describe('notificationRepository', () => {

  it('createNotification creates and saves a notification', async () => {
    const res = await createNotification(5, 9);

    expect(notificationRepoStub.create).toHaveBeenCalledWith({ user: { id: 5 }, message: { id: 9 } });
    expect(notificationRepoStub.save).toHaveBeenCalled();
    expect(res).toEqual(fakeNotification);
  });

  it('getUnreadNotifications returns unread notifications with relations', async () => {
    const res = await getUnreadNotifications(42);

    expect(notificationRepoStub.find).toHaveBeenCalledWith({
      where: { user: { id: 42 }, read: false },
      relations: ['message', 'message.conversation']
    });
    expect(res).toEqual(mockNotifications);
  });

  it('markNotificationsAsReadForConversation marks notifications read and returns count', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockNotifications)
    };
    notificationRepoStub.createQueryBuilder.mockReturnValue(qb);
    notificationRepoStub.save.mockImplementation(async n => n);

    const updatedCount = await markNotificationsAsReadForConversation(7, 555);

    expect(notificationRepoStub.createQueryBuilder).toHaveBeenCalledWith('notification');
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('notification.message', 'message');
    expect(qb.where).toHaveBeenCalled();
    expect(qb.andWhere).toHaveBeenCalled();
    expect(notificationRepoStub.save).toHaveBeenCalledTimes(mockNotifications.length);
    expect(updatedCount).toBe(mockNotifications.length);
    expect(mockNotifications.every(n => n.read === true)).toBeTruthy();
  });

  it('getUnreadCountByConversation groups counts by conversation id', async () => {
    const notifications = [
      { id: 10, read: false, message: { id: 21, conversation: { id: 'c1' } } },
      { id: 11, read: false, message: { id: 22, conversation: { id: 'c1' } } },
      { id: 12, read: false, message: { id: 23, conversation: { id: 'c2' } } }
    ];
    notificationRepoStub.find.mockResolvedValueOnce(notifications);

    const counts = await getUnreadCountByConversation(99);

    expect(notificationRepoStub.find).toHaveBeenCalledWith({
      where: { user: { id: 99 }, read: false },
      relations: ['message', 'message.conversation']
    });
    expect(counts).toEqual({ 'c1': 2, 'c2': 1 });
  });
});

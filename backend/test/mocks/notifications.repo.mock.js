import {jest} from "@jest/globals";

export const mockRepo = {
    createNotification: jest.fn(),
    getUnreadNotifications: jest.fn(),
    markNotificationsAsReadForConversation: jest.fn(),
    getUnreadCountByConversation: jest.fn(),
};

await jest.unstable_mockModule('../../../repositories/notificationRepository.js', () => ({
    createNotification: mockRepo.createNotification,
    getUnreadNotifications: mockRepo.getUnreadNotifications,
    markNotificationsAsReadForConversation: mockRepo.markNotificationsAsReadForConversation,
    getUnreadCountByConversation: mockRepo.getUnreadCountByConversation,
}));
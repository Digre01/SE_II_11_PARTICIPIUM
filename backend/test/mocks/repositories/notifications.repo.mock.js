import {jest} from "@jest/globals";

export const mockNotificationRepo = {
    createNotification: jest.fn(),
    getUnreadNotifications: jest.fn(),
    markNotificationsAsReadForConversation: jest.fn(),
    getUnreadCountByConversation: jest.fn(),
};

await jest.unstable_mockModule('../../../repositories/notificationRepository.js', () => ({
    createNotification: mockNotificationRepo.createNotification,
    getUnreadNotifications: mockNotificationRepo.getUnreadNotifications,
    markNotificationsAsReadForConversation: mockNotificationRepo.markNotificationsAsReadForConversation,
    getUnreadCountByConversation: mockNotificationRepo.getUnreadCountByConversation,
}));
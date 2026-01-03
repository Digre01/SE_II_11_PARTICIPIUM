export const mockConversations = async (page, conversations) => {
    await page.route('**/api/v1/conversations', route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(conversations),
        })
    );
};

export const mockMessages = async (page, conversationId, handler) => {
    await page.route(`**/api/v1/conversations/${conversationId}/messages`, handler);
};

export const gotoConversation = async (page, id, waitMs = 300) => {
    await page.goto(`/conversations/${id}`);
    await page.waitForTimeout(waitMs);
};

export const getMessageInput = (page) =>
    page.locator('input[placeholder="Type your message..."]');

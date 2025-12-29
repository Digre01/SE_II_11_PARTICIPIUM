export async function mockNotifications(page, body, status = 200) {
    await page.route('**/api/v1/notifications', route =>
        route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(body),
        })
    );
}

export function notificationsBadge(page) {
    return page
        .locator('xpath=//span[contains(., "Notifications")]/following-sibling::span')
        .first();
}

export async function gotoHomeAndWaitHeader(page) {
    await page.goto('/');
    await page.waitForSelector('text=Notifications');
}
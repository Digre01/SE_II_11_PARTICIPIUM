export async function mockCurrentSession(page, session) {
    await page.route('**/api/v1/sessions/current', route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(session),
        })
    );
}

export const loginAsUser = async (page, { username, password }) => {
    await page.goto(`/login`);

    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);

    await Promise.all([
        page.waitForNavigation({ url: '**/' }),
        page.click('text=Confirm'),
    ]);

    // best-effort login verification (non bloccante)
    await page.waitForSelector('text=Logout', { timeout: 5000 }).catch(() => {});
};

export const logout = async (page) => {
    await page.click("text=Logout")
}
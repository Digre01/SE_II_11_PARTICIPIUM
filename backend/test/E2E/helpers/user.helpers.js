export async function mockRoles(page, roles = []) {
    await page.route('**/api/v1/roles', route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(roles),
        })
    );
}

export async function mockAssignRoles(page, responseBody, status = 200) {
    let captured = null;

    await page.route('**/api/v1/sessions/*/roles', async route => {
        const post = await route.request().postData();
        try {
            captured = JSON.parse(post);
        } catch {
            captured = post;
        }

        await route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(responseBody),
        });
    });

    return () => captured;
}

export async function putRoles(page, sessionId, body) {
    return page.evaluate(
        async ({ sessionId, body }) => {
            const res = await fetch(`/api/v1/sessions/${sessionId}/roles`, {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(body),
            });

            const json = await res.json().catch(() => null);
            return { status: res.status, body: json };
        },
        { sessionId, body }
    );
}
export const waitForMap = async (page) => {
    try {
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });
        return '.leaflet-container';
    } catch {
        await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });
        return '[data-testid="map-container"]';
    }
};

export const waitForMapAndClickCenter = async (page) => {
    const selector = waitForMap(page)

    const map = await page.$(selector);
    const box = await map.boundingBox();

    await page.mouse.click(
        box.x + box.width / 2,
        box.y + box.height / 2
    );
};


export const waitForReportsRoute = async (page, reports) => {
    let routeCalled = false;
    await page.route('**/api/v1/reports/assigned', route => {
        routeCalled = true;
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(reports) });
    });
    return () => routeCalled;
};

export const getClusters = async (page) => page.$$('.marker-cluster');
export const getMarkers = async (page) => page.$$('.leaflet-marker-icon');

export const clickMarkersUntilFound = async (page, titles) => {
    const found = {};
    const markers = await getMarkers(page);
    for (const m of markers) {
        try {
            await m.click({ force: true });
            await page.waitForTimeout(300);
            const popup = await page.$('.leaflet-popup-content');
            if (!popup) continue;
            const text = (await popup.textContent()) || '';
            titles.forEach(title => {
                if (text.includes(title)) found[title] = text;
            });
            if (Object.keys(found).length === titles.length) break;
        } catch { /* empty */ }
    }
    return found;
};

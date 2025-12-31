export const waitForMap = async (page) => {
    try {
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });
        return '.leaflet-container';
    } catch {
        await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });
        return '[data-testid="map-container"]';
    }
};

export const selectPointOnMap = async (page) => {
    const selector = await waitForMap(page)

    const map = await page.$(selector);
    const box = await map.boundingBox();

    await page.mouse.click(
        box.x + box.width / 2,
        box.y + box.height / 2
    );
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
                const cleanText = text.toLowerCase();
                const cleanTitle = title.toLowerCase().replace(/\s+/g, '');
                if (!found[title] && cleanText.replace(/\s+/g, '').includes(cleanTitle)) {
                    found[title] = text;
                }
            });
            if (Object.keys(found).length === titles.length) break;
        } catch { /* empty */ }
    }
    return found;
};

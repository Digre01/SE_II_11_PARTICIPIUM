import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

let turinPolygon = null;

try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const boundariesPath = path.join(__dirname, '..', 'data', 'turin_boundaries.json');
    const raw = fs.readFileSync(boundariesPath, 'utf-8');
    const turinData = JSON.parse(raw);
    const cityBoundary = Array.isArray(turinData)
        ? (turinData.find(d => d.addresstype === 'city') || turinData[0])
        : turinData;
    turinPolygon = cityBoundary?.geojson || null;
    console.log('Turin boundaries loaded successfully.');
} catch (error) {
    console.warn('⚠️ Warning: Could not load turin_boundaries.json. Location check will be skipped.');
}

export function isInTurin(lat, lon) {
    if (!turinPolygon) return true;
    const userLocation = point([lon, lat]);
    return booleanPointInPolygon(userLocation, turinPolygon);
}

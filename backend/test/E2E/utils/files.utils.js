import fs from 'fs';
import path from 'node:path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

export function attachFakeImage(req, name) {
    const buffer = Buffer.from(
        '89504E470D0A1A0A0000000D4948445200000001000000010806000000' +
        '1F15C4890000000A49444154789C6360000002000100A8C6B28B00000000' +
        '49454E44AE426082',
        'hex'
    );
    return req.attach('photos', buffer, name);
}

export function deleteReturnedPhotos(photos) {
    for (const p of photos || []) {
        try {
            const filename = path.basename(p);
            const fullPath = path.join(PUBLIC_DIR, filename);

            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        } catch {}
    }
}

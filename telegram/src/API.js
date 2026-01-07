// In Docker Compose, the backend service is reachable at http://backend:3000 from the telegram container.
const SERVER_URL = process.env.SERVER_URL || 'http://backend:3000';

let COOKIE_HEADER = '';

function setSessionCookiesFromResponse(res) {
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    // Keep only name=value pairs; drop attributes like Path, HttpOnly, SameSite
    const cookiePairs = setCookie
      .split(/,(?=[^,;]+=[^,;]+)/) // split multiple cookies safely
      .map(c => c.split(';')[0])
      .filter(Boolean);
    COOKIE_HEADER = cookiePairs.join('; ');
  }
}

function getSessionHeaders(extra = {}) {
  const headers = { ...extra };
  if (COOKIE_HEADER) headers['Cookie'] = COOKIE_HEADER;
  return headers;
}

// GET /api/v1/categories
export async function fetchCategories() {
  const res = await fetch(`${SERVER_URL}/api/v1/categories`, { headers: getSessionHeaders(), credentials: 'include' });
  if (res.ok) return await res.json();
  throw await res.text();
}


export async function fetchTelegramPhoto(bot, fileId) {

  const file = await bot.telegram.getFile(fileId);
  if (!file || !file.file_path) {
    const url = await bot.telegram.getFileLink(fileId);
    const response = await fetch(url.href || url.toString());
    if (!response.ok) throw new Error(`Failed to download photo ${fileId}`);
    const ct = response.headers.get('content-type') || '';
    const guessedExt = ct.includes('png') ? 'png' : 'jpg';
    const filename = `photo_${fileId}.${guessedExt}`;
    const raw = await response.blob();
    // Force a safe image MIME to pass multer image filter
    const forcedType = guessedExt === 'png' ? 'image/png' : 'image/jpeg';
    const blob = new Blob([raw], { type: forcedType });
    return { filename, blob };
  }

  // Build direct file URL
  const token = process.env.TELEGRAM_TOKEN || process.env.BOT_TOKEN;
  const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`Failed to download telegram file ${fileId}`);
  const path = file.file_path.toLowerCase();
  const isPng = path.endsWith('.png');
  const ext = isPng ? 'png' : 'jpg';
  const filename = `photo_${fileId}.${ext}`;
  const rawBlob = await res.blob();
  const blob = new Blob([rawBlob], { type: isPng ? 'image/png' : 'image/jpeg' });
  return { filename, blob };
}


// wizardReport = { title, description, category, location: {lat, lon}, photos: [{file_id}], isAnonymous }
export async function buildReportFormData(bot, wizardReport, options = {}) {
  const fd = new FormData();
  fd.append('title', wizardReport.title);
  fd.append('description', wizardReport.description);
  fd.append('categoryId', String(wizardReport.categoryId));
  fd.append('latitude', String(wizardReport.location.lat));
  fd.append('longitude', String(wizardReport.location.lon));
  fd.append('isAnonymous', wizardReport.isAnonymous ? 'true' : 'false');

  // Photos: up to 3
  const limit = Math.min(3, wizardReport.photos?.length || 0);
  for (let i = 0; i < limit; i++) {
    const p = wizardReport.photos[i];
    try {
      const { filename, blob } = await fetchTelegramPhoto(bot, p.file_id);
      fd.append('photos', blob, filename);
    } catch (err) {
      console.error('Skipping photo download error:', err);
    }
  }

  return fd;
}

// POST /api/v1/reports
export async function createReport(formData) {
  const res = await fetch(`${SERVER_URL}/api/v1/reports`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: getSessionHeaders()
  });
  if (res.ok) return await res.json();
  throw await res.text();
}

export async function createReportFromWizard(bot, wizardReport, options = {}) {
  const fd = await buildReportFormData(bot, wizardReport, options);
  return await createReport(fd);
}

// Verify Telegram code and persist session cookies for subsequent requests.
export async function verifyTelegram(username, code) {
  const res = await fetch(`${SERVER_URL}/api/v1/sessions/telegram/verify`, {
    method: 'POST',
    headers: getSessionHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ username, code }),
    credentials: 'include'
  });
  if (!res.ok) {
    let err = await res.json();
    throw new Error(err.message || 'Verification failed');
  }
  setSessionCookiesFromResponse(res);
  const data = await res.json();
  return data;
}

// GET current authenticated user using persisted session cookie
export async function fetchCurrentUser() {
  const res = await fetch(`${SERVER_URL}/api/v1/sessions/current`, {
    method: 'GET',
    headers: getSessionHeaders(),
    credentials: 'include'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Not authenticated');
  }
  return await res.json();
}

export default { SERVER_URL, fetchCategories, fetchTelegramPhoto, buildReportFormData, createReport, createReportFromWizard, verifyTelegram, fetchCurrentUser };

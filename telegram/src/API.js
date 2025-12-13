// Simple API client for the Telegram bot to interact with the webapp backend
// Uses multipart/form-data for report creation and supports downloading photos by Telegram file_id

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

// GET /api/v1/categories
export async function fetchCategories() {
  const res = await fetch(`${SERVER_URL}/api/v1/categories`, { credentials: 'include' });
  if (res.ok) return await res.json();
  throw await res.text();
}

// Helper: fetch a file from Telegram by file_id and return { filename, blob }
// Requires a Telegraf bot instance to resolve the file link.
export async function fetchTelegramPhoto(bot, fileId) {
  const url = await bot.telegram.getFileLink(fileId);
  const response = await fetch(url.href || url.toString());
  
  if (!response.ok) {
    throw new Error(`Failed to download photo ${fileId}`);
  }
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const ext = contentType.includes('jpeg') ? 'jpg' : contentType.includes('png') ? 'png' : 'bin';
  const filename = `photo_${fileId}.${ext}`;
  const blob = await response.blob();
  return { filename, blob };
}

// Build FormData for report creation from wizard state
// wizardReport = { title, description, category, location: {lat, lon}, photos: [{file_id}], anonymous }
export async function buildReportFormData(bot, wizardReport, options = {}) {
  const fd = new FormData();
  fd.append('title', wizardReport.title);
  fd.append('description', wizardReport.description);
  fd.append('category', wizardReport.category);
  fd.append('latitude', String(wizardReport.location.lat));
  fd.append('longitude', String(wizardReport.location.lon));
  fd.append('anonymous', wizardReport.anonymous ? 'true' : 'false');

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
    credentials: 'include'
  });
  if (res.ok) return await res.json();
  throw await res.text();
}

export async function createReportFromWizard(bot, wizardReport, options = {}) {
  const fd = await buildReportFormData(bot, wizardReport, options);
  return await createReport(fd);
}

export default { SERVER_URL, fetchCategories, fetchTelegramPhoto, buildReportFormData, createReport, createReportFromWizard };

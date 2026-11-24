/**
 * MediExtract AI — Centralized API Client
 */

const BASE_URL = '/api';
const TIMEOUT_MS = 60000;

class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);

    if (!response.ok) {
      let detail = '';
      try {
        const body = await response.json();
        if (Array.isArray(body.detail)) {
          detail = body.detail.map((d) => d.msg || JSON.stringify(d)).join('; ');
        } else {
          detail = body.detail || JSON.stringify(body);
        }
      } catch {
        detail = await response.text();
      }
      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
        detail,
      );
    }

    return response.json();
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out', 0, 'The server did not respond in time.');
    }
    throw err;
  }
}

export async function checkHealth() {
  return fetchWithTimeout(`${BASE_URL}/health`, {}, 8000);
}

export async function extractFromText(text) {
  return fetchWithTimeout(`${BASE_URL}/extract/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

export async function extractFromFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return fetchWithTimeout(`${BASE_URL}/extract/file`, {
    method: 'POST',
    body: formData,
  });
}

export async function extractFromImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  return fetchWithTimeout(`${BASE_URL}/extract/image`, {
    method: 'POST',
    body: formData,
  });
}

export { ApiError };

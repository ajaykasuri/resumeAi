/** Save a Blob as a file download. */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const safeFileName = (title, fallback = 'resume') =>
  (String(title || fallback).trim().replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase() || fallback);

/**
 * With axios `responseType: 'blob'` an API error body arrives as a Blob.
 * Turn it back into the server's JSON `message` so users see the real reason.
 */
export async function readBlobError(error, fallback) {
  const data = error?.response?.data;
  try {
    if (data instanceof Blob) {
      const parsed = JSON.parse(await data.text());
      if (parsed?.message) return parsed.message;
    } else if (data?.message) {
      return data.message;
    }
  } catch (_) { /* not JSON */ }
  return error?.message && !error.response ? error.message : fallback;
}

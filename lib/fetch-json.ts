/**
 * `fetch` + JSON parse that fails with a readable error instead of a SyntaxError.
 *
 * Calling `res.json()` straight after a fetch assumes the response is JSON. It usually is —
 * until something returns an HTML page instead: a dev-server restart mid-request, a 500
 * error page, a proxy redirect to a login screen, or an offline captive portal. Then the
 * parser hits the "<" of "<!DOCTYPE html>" and throws
 *
 *     Unexpected token '<', "<!DOCTYPE "... is not valid JSON
 *
 * which says nothing about which request failed or why. This checks the content type first,
 * so callers get a real message and their existing catch blocks behave sensibly.
 */
export class HttpJsonError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpJsonError';
    this.status = status;
  }
}

export async function fetchJson<T = unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const contentType = res.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    // Read a little of the body for the log — an HTML error page usually names the problem.
    const preview = (await res.text().catch(() => '')).slice(0, 120);
    throw new HttpJsonError(
      `Expected JSON from ${typeof input === 'string' ? input : String(input)} but got ` +
        `${contentType || 'no content-type'} (HTTP ${res.status})${preview ? `: ${preview}` : ''}`,
      res.status
    );
  }

  return res.json() as Promise<T>;
}

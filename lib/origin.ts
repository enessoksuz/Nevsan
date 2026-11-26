export function requestOrigin(request: { url: string; headers: { get(name: string): string | null } }) {
  const url = new URL(request.url);
  const host = request.headers.get("host") || url.host;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return `${url.protocol}//${host}`;
  return url.origin;
}

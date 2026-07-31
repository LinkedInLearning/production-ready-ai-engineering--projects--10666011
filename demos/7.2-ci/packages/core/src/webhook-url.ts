// Framework-free guard for outbound webhook destinations. Returns true only for
// URLs that are safe for the server to POST to: HTTPS, and NOT pointing at
// loopback / link-local / private (RFC 1918) hosts. This blocks the common SSRF
// targets — notably the cloud metadata endpoint at 169.254.169.254.
//
// This is a hostname allowlist guard, not a complete SSRF defence (it does not
// resolve DNS). Use it together with a *server-configured* destination; never
// validate a caller-supplied URL and then trust it.
export function isSafeWebhookUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return !isInternalHost(url.hostname);
}

function isInternalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, ""); // strip IPv6 brackets

  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1" || host === "0.0.0.0") return true;

  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 0) return true; // "this" network
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 169 && b === 254) return true; // link-local (incl. metadata)
    if (a === 192 && b === 168) return true; // private
    if (a === 172 && b >= 16 && b <= 31) return true; // private
  }
  return false;
}

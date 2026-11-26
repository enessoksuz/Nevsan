export const ADMIN_COOKIE = "nevsan_admin";

function secret() {
  return process.env.ADMIN_SECRET ?? "";
}

async function hmacHex(value: string, key: string) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signToken() {
  const key = secret();
  if (!key) throw new Error("ADMIN_SECRET missing");
  return `ok.${await hmacHex("ok", key)}`;
}

export async function isValidToken(token: string | undefined | null) {
  const key = secret();
  if (!token || !key) return false;
  return same(token, `ok.${await hmacHex("ok", key)}`);
}

export async function passwordOk(input: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  const key = secret();
  if (!expected || !key || !input) return false;
  return same(await hmacHex(input, key), await hmacHex(expected, key));
}

export function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure,
    maxAge: 60 * 60 * 24 * 14,
  };
}

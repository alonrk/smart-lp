import { prisma } from "@/lib/db";

const WIX_OAUTH = "https://www.wixapis.com/oauth";

type WixRequestOpts = {
  accessToken?: string;
  sourceDocUrl: string;
};

/**
 * Call a Wix REST API with a user's access token.
 * Token is refreshed on 401 when refresh_token is available.
 */
export async function wixAccountRequest(
  method: string,
  url: string,
  connection: { accessToken: string; refreshToken: string | null; id: string; userId: string } | undefined,
  body: Record<string, unknown> | null,
  opts: WixRequestOpts,
) {
  const raw = connection?.accessToken ?? opts.accessToken;
  if (!raw) {
    return new Response(JSON.stringify({ error: "No Wix access token" }), {
      status: 401,
    });
  }
  const auth = raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: auth,
  };
  const payload =
    body && (method === "POST" || method === "PUT" || method === "PATCH")
      ? JSON.stringify(body)
      : undefined;
  let res = await fetch(url, { method, headers, body: payload });
  if (res.status === 401 && connection?.refreshToken) {
    const refreshed = await refreshWixToken({
      id: connection.id,
      userId: connection.userId,
      refreshToken: connection.refreshToken,
    });
    if (refreshed) {
      const h2 = { ...headers, Authorization: `Bearer ${refreshed}` };
      res = await fetch(url, {
        method,
        headers: h2,
        body: body && method !== "GET" ? JSON.stringify(body) : undefined,
      });
    }
  }
  return res;
}

async function refreshWixToken(conn: {
  id: string;
  userId: string;
  refreshToken: string;
}): Promise<string | null> {
  const id = process.env.WIX_CLIENT_ID;
  const secret = process.env.WIX_CLIENT_SECRET;
  if (!id || !secret) return null;
  const r = await fetch(`${WIX_OAUTH}/access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: id,
      client_secret: secret,
      refresh_token: conn.refreshToken,
    }),
  });
  if (!r.ok) return null;
  const j = (await r.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  const expiresAt = j.expires_in
    ? new Date(Date.now() + j.expires_in * 1000)
    : null;
  await prisma.wixConnection.update({
    where: { id: conn.id },
    data: {
      accessToken: j.access_token,
      refreshToken: j.refresh_token ?? conn.refreshToken,
      expiresAt,
    },
  });
  return j.access_token;
}

export function wixAuthorizeUrl(): string {
  const clientId = process.env.WIX_CLIENT_ID;
  const redirect = process.env.WIX_REDIRECT_URI;
  if (!clientId || !redirect) {
    return "/settings?wix=missing";
  }
  const scopes = process.env.WIX_SCOPES ?? "OFFLINE_USE";
  const u = new URL("https://www.wix.com/installer/install");
  u.searchParams.set("appId", clientId);
  u.searchParams.set("redirectUrl", redirect);
  // For OAuth app install flow, Wix often uses app installer. Headless uses:
  // https://www.wix.com/oauth/authorize?client_id=...&response_type=code&...
  const o = new URL("https://www.wix.com/oauth/authorize");
  o.searchParams.set("client_id", clientId);
  o.searchParams.set("response_type", "code");
  o.searchParams.set("redirect_uri", redirect);
  o.searchParams.set("scope", scopes);
  return o.toString();
}

export async function exchangeWixCode(code: string) {
  const id = process.env.WIX_CLIENT_ID;
  const secret = process.env.WIX_CLIENT_SECRET;
  const redirect = process.env.WIX_REDIRECT_URI;
  if (!id || !secret || !redirect) throw new Error("Wix env not configured");
  const r = await fetch("https://www.wixapis.com/oauth/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: id,
      client_secret: secret,
      code,
      redirect_uri: redirect,
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Wix token exchange failed: ${t}`);
  }
  return (await r.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
}

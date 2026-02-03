import fetch from "node-fetch";

export async function getTekmetricToken() {
  const clientId =
    process.env.TEKMETRIC_CLIENT_ID || process.env.TM_CLIENT_ID;

  const clientSecret =
    process.env.TEKMETRIC_CLIENT_SECRET || process.env.TM_CLIENT_SECRET;

  const tokenUrl =
    process.env.TM_TOKEN_URL ||
    "https://sandbox.tekmetric.com/oauth/token";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Tekmetric credentials not set in environment. Required: TEKMETRIC_CLIENT_ID and TEKMETRIC_CLIENT_SECRET"
    );
  }

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const data = await res.json();

  if (!data.access_token) {
    throw new Error(
      "Tekmetric token response missing access_token: " +
        JSON.stringify(data)
    );
  }

  return data.access_token;
}

import Ably from "ably/promises";

export const GET = async (req, res) => {
    const client = new Ably.Rest(import.meta.env.VITE_ABLY_API_KEY);
    const clientId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const tokenRequestData = await client.auth.createTokenRequest({ clientId });

    return res.json(tokenRequestData);
}

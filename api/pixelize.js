const WINDOW_MS = 60 * 60 * 1000;
const MAX_GENERATIONS_PER_WINDOW = 4;
const rateLimits = globalThis.__fullCourtChaosRateLimits || new Map();
globalThis.__fullCourtChaosRateLimits = rateLimits;

function clientKey(request) {
  const forwarded = request.headers['x-forwarded-for'];
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function canGenerate(key) {
  const now = Date.now();
  const recent = (rateLimits.get(key) || []).filter(time => now - time < WINDOW_MS);
  if (recent.length >= MAX_GENERATIONS_PER_WINDOW) return false;
  recent.push(now);
  rateLimits.set(key, recent);
  return true;
}

function safeLabel(value, fallback) {
  return String(value || fallback).replace(/[^a-z0-9 -]/gi, '').slice(0, 20) || fallback;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });

  const key = clientKey(request);
  if (!canGenerate(key)) return response.status(429).json({ error: 'That player is on cooldown. Try again in about an hour.' });

  const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : (request.body || {});
  const { photo } = body;
  if (typeof photo !== 'string' || !/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(photo)) {
    return response.status(400).json({ error: 'Please upload a valid player photo.' });
  }
  if (photo.length > 4_000_000) return response.status(413).json({ error: 'That photo is too large. Try a smaller image.' });

  const requestOidcToken = request.headers['x-vercel-oidc-token'];
  const gatewayToken = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || (Array.isArray(requestOidcToken) ? requestOidcToken[0] : requestOidcToken);
  const openAiToken = process.env.OPENAI_API_KEY;
  const token = gatewayToken || openAiToken;
  if (!token) return response.status(503).json({ error: 'The avatar forge is warming up. Please try again shortly.' });

  const protocol = request.headers['x-forwarded-proto'] || 'https';
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  const styleReference = `${protocol}://${host}/players/nova.png`;
  const alias = safeLabel(body.alias, 'ROOKIE');
  const position = safeLabel(body.position, 'GUARD');
  const usingGateway = Boolean(gatewayToken);
  const baseUrl = usingGateway ? 'https://ai-gateway.vercel.sh/v1' : 'https://api.openai.com/v1';
  const model = usingGateway ? 'openai/gpt-image-1.5' : 'gpt-image-1.5';

  const prompt = `
Image 1 is the player's identity reference photo. Image 2 is the exact visual-style reference for the output.

Create one original, isolated full-body youth basketball gameplay sprite for the alter ego ${alias}, position ${position}. Preserve the real person's recognizable facial structure, skin tone, hair texture, hairstyle, and overall identity from Image 1. Do not invent a different face. Transform their clothing into an original navy basketball uniform with hot-pink, cyan, and cream trim, with no logo, team name, or number. Show the complete body from head to sneakers in a balanced ready-to-dribble pose with an orange basketball.

Match Image 2's rendering very closely: authentic early-1990s 32-bit arcade basketball gameplay sprite made from a digitized live-action athlete; realistic human proportions; simplified but recognizable face; hard jagged pixel cutout; limited flat shadow bands; visible chunky pixel clusters; low-resolution game sprite faithfully nearest-neighbor upscaled. This must look like a gameplay sprite, not a poster, painting, modern illustration, 3D render, voxel character, or smooth vector art.

Output one centered figure only on a transparent background. Keep all hair, limbs, ball, and shoes fully visible with generous padding. No floor, cast shadow, UI, text, logos, trademarks, watermark, or existing athlete likeness beyond the supplied person's identity.
`.trim();

  try {
    const upstream = await fetch(`${baseUrl}/images/edits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        images: [{ image_url: photo }, { image_url: styleReference }],
        prompt,
        input_fidelity: 'high',
        background: 'transparent',
        output_format: 'webp',
        output_compression: 82,
        size: '1024x1536',
        quality: 'medium',
        n: 1,
      }),
    });
    const result = await upstream.json();
    const encoded = result?.data?.[0]?.b64_json;
    if (!upstream.ok || !encoded) {
      console.error('Avatar generation failed', upstream.status, result?.error?.message || 'No image returned');
      return response.status(502).json({ error: 'The avatar forge missed that shot. Please try the photo again.' });
    }
    return response.status(200).json({ avatar: `data:image/webp;base64,${encoded}` });
  } catch (error) {
    console.error('Avatar generation request failed', error);
    return response.status(502).json({ error: 'The avatar forge could not connect. Please try again.' });
  }
}

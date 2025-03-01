import cookie from 'cookie';

export default function handler(req, res) {
  // Vérifier si c'est une requête POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Supprimer les cookies de session
  res.setHeader('Set-Cookie', [
    cookie.serialize('discord_access_token', '', {
      maxAge: -1,
      path: '/',
    }),
    cookie.serialize('discord_refresh_token', '', {
      maxAge: -1,
      path: '/',
    }),
    cookie.serialize('discord_token_expiry', '', {
      maxAge: -1,
      path: '/',
    }),
  ]);

  // Répondre avec succès
  return res.status(200).json({ success: true });
}
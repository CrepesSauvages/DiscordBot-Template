import { parseCookies, isAuthenticated, getUserInfo } from '../../../lib/auth';

export default async function handler(req, res) {
  // Vérifier si c'est une requête GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vérifier si l'utilisateur est authentifié
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Récupérer le token d'accès des cookies
    const cookies = parseCookies(req);
    const accessToken = cookies.discord_access_token;
    
    // Récupérer les informations de l'utilisateur
    const userData = await getUserInfo(accessToken);
    
    // Répondre avec les informations de l'utilisateur
    return res.status(200).json(userData);
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
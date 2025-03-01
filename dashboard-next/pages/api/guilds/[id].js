import { parseCookies, isAuthenticated } from '../../../lib/auth';
import axios from 'axios';

// URL de base de l'API du bot
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001/api';

export default async function handler(req, res) {
  // Vérifier si c'est une requête GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vérifier si l'utilisateur est authentifié
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Récupérer l'ID du serveur depuis l'URL
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Guild ID is required' });
  }

  try {
    // Récupérer le token d'accès des cookies
    const cookies = parseCookies(req);
    const accessToken = cookies.discord_access_token;
    
    // Récupérer les détails du serveur depuis l'API du bot
    const response = await axios.get(`${BOT_API_URL}/guilds/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    // Répondre avec les détails du serveur
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails du serveur ${id}:`, error);
    
    // Si le serveur n'est pas trouvé
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'Guild not found' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
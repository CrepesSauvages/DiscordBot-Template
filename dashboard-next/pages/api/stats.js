import { parseCookies, isAuthenticated } from '../../lib/auth';
import axios from 'axios';

// URL de base de l'API du bot
// Utiliser le port 3001 comme configuré dans server.js du bot
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

  try {
    // Récupérer le token d'accès des cookies
    const cookies = parseCookies(req);
    const accessToken = cookies.discord_access_token;
    
    // Récupérer les statistiques depuis l'API du bot
    const response = await axios.get(`${BOT_API_URL}/stats`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      // Ajouter un timeout pour éviter d'attendre trop longtemps
      timeout: 3000
    });
    
    // Répondre avec les statistiques
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    
    // Données de secours en cas d'erreur ou si le backend n'est pas disponible
    const fallbackStats = {
      servers: 0,
      users: 0,
      messages: 0,
      commands: 0,
      uptime: "3 jours, 7 heures",
      version: "1.0.0",
      // Indiquer que ce sont des données de secours
      _fallback: true
    };
    
    // Ajouter un en-tête pour indiquer que ce sont des données de secours
    res.setHeader('X-Using-Fallback-Data', 'true');
    return res.status(200).json(fallbackStats);
  }
}
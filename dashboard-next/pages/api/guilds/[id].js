import { parseCookies, isAuthenticated } from '../../../lib/auth';
import axios from 'axios';

// URL de base de l'API du bot
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001/';

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

  // TEMPORAIRE: Utiliser des données de test pour contourner les problèmes d'authentification
  const USE_TEST_DATA = false; // Mettre à false pour utiliser l'API réelle

  if (USE_TEST_DATA) {
    // Données de test pour le serveur
    const testGuildData = {
      id: id,
      name: `Serveur Discord ${id}`,
      icon: null,
      memberCount: 150,
      owner: {
        id: '123456789012345678',
        tag: 'Owner#1234'
      },
      channels: [
        { id: '111111111111111111', name: 'général', type: 0 },
        { id: '222222222222222222', name: 'annonces', type: 0 },
        { id: '333333333333333333', name: 'logs', type: 0 },
        { id: '444444444444444444', name: 'salon-vocal-1', type: 2 },
        { id: '555555555555555555', name: 'salon-vocal-2', type: 2 }
      ],
      roles: [
        { id: '666666666666666666', name: '@everyone', color: '#000000' },
        { id: '777777777777777777', name: 'Admin', color: '#FF0000' },
        { id: '888888888888888888', name: 'Modérateur', color: '#00FF00' },
        { id: '999999999999999999', name: 'Membre', color: '#0000FF' }
      ]
    };
    
    return res.status(200).json(testGuildData);
  }

  try {
    // Récupérer le token d'accès des cookies
    const cookies = parseCookies(req);
    const accessToken = cookies.discord_access_token;
    
    // Récupérer les détails du serveur depuis l'API du bot
    const response = await axios.get(`${BOT_API_URL}api/guilds/${id}`, {
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
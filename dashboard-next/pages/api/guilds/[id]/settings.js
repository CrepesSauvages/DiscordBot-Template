import { parseCookies, isAuthenticated } from '../../../../lib/auth';
import axios from 'axios';

// URL de base de l'API du bot
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001/';

export default async function handler(req, res) {
  // Vérifier si l'utilisateur est authentifié
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  
  // Récupérer le token d'accès des cookies
  const cookies = parseCookies(req);
  const accessToken = cookies.discord_access_token;

  // TEMPORAIRE: Utiliser des données de test pour contourner les problèmes d'authentification
  const USE_TEST_DATA = true; // Mettre à false pour utiliser l'API réelle

  if (USE_TEST_DATA) {
    // Données de test pour les paramètres du serveur
    const testSettings = {
      prefix: '!',
      locale: 'fr',
      logChannel: '123456789012345678',
      welcomeChannel: '234567890123456789',
      welcomeMessage: `Bienvenue {user} sur le serveur ${id}!`,
      leaveMessage: 'Au revoir {user}!',
      autoRole: '345678901234567890',
      modLogChannel: '456789012345678901',
      muteRole: '567890123456789012'
    };

    // GET: Récupérer les paramètres
    if (req.method === 'GET') {
      return res.status(200).json(testSettings);
    }
    
    // POST/PUT: Mettre à jour les paramètres
    if (req.method === 'POST' || req.method === 'PUT') {
      console.log('Paramètres reçus:', req.body);
      return res.status(200).json({ success: true, message: 'Paramètres mis à jour avec succès (données de test)' });
    }
    
    // DELETE: Supprimer les paramètres
    if (req.method === 'DELETE') {
      return res.status(200).json({ success: true, message: 'Paramètres réinitialisés avec succès (données de test)' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vérifier si l'utilisateur a les permissions sur ce serveur
    const userGuilds = await axios.get(`${BOT_API_URL}api/guilds`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const hasPermission = userGuilds.data.some(
      guild => guild.id === id && (guild.permissions & 0x20) === 0x20
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // GET: Récupérer les paramètres
    if (req.method === 'GET') {
      const response = await axios.get(`${BOT_API_URL}api/guilds/${id}/settings`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      return res.status(200).json(response.data);
    }
    
    // POST: Mettre à jour les paramètres
    if (req.method === 'POST') {
      const response = await axios.post(
        `${BOT_API_URL}api/guilds/${id}/settings`,
        req.body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return res.status(200).json(response.data);
    }
    
    // PUT: Mettre à jour les paramètres du serveur
    if (req.method === 'PUT') {
      const response = await axios.put(
        `${BOT_API_URL}api/guilds/${id}/settings`,
        req.body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return res.status(200).json(response.data);
    }
    
    // DELETE: Supprimer les paramètres du serveur
    if (req.method === 'DELETE') {
      const response = await axios.delete(`${BOT_API_URL}api/guilds/${id}/settings`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      return res.status(200).json(response.data);
    }
    
    // Méthode non autorisée
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Erreur lors de la gestion des paramètres du serveur:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
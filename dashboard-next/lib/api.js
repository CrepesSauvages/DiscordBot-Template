import axios from 'axios';

// URL de base de votre API backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Créer une instance axios avec des configurations par défaut
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important pour les cookies d'authentification
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fonction pour obtenir les serveurs de l'utilisateur
export async function getUserServers() {
  try {
    const response = await api.get('/guilds');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des serveurs:', error);
    return [];
  }
}

// Fonction pour obtenir les détails d'un serveur
export async function getServerDetails(serverId) {
  try {
    const response = await api.get(`/guilds/${serverId}`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails du serveur ${serverId}:`, error);
    return null;
  }
}

// Fonction pour obtenir les commandes du bot
export async function getCommands() {
  try {
    const response = await api.get('/commands');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return [];
  }
}

// Fonction pour obtenir les cas de modération
export async function getModerationCases(serverId) {
  try {
    const response = await api.get(`/guilds/${serverId}/moderation`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des cas de modération:', error);
    return [];
  }
}

// Fonction pour obtenir les statistiques globales du bot
export async function getBotStats() {
  try {
    const response = await api.get('/stats');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du bot:', error);
    return {
      servers: 0,
      users: 0,
      commands: 0,
      uptime: 0
    };
  }
}

export { api };
import axios from 'axios';
import * as cookie from 'cookie';

// URL de base de l'API Discord
const DISCORD_API = 'https://discord.com/api/v10';

// Configuration OAuth2
const config = {
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || '1014305078997422111',
  clientSecret: process.env.CLIENT_SECRET || 'X6-CrCUTXJwUiIHsoBqgv3am9ab_7EFc',
  redirectUri: 'http://localhost:3002/api/auth/discord/callback',
  scope: 'identify guilds',
};

// Fonction pour obtenir l'URL d'autorisation Discord
export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope,
  });

  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

// Fonction pour échanger le code contre un token
export async function exchangeCode(code) {
  try {
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      scope: config.scope,
    });

    const response = await axios.post(`${DISCORD_API}/oauth2/token`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'échange du code:', error);
    throw new Error('Failed to exchange code for token');
  }
}

// Fonction pour obtenir les informations de l'utilisateur Discord
export async function getUserInfo(accessToken) {
  try {
    const response = await axios.get(`${DISCORD_API}/users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur:', error);
    throw new Error('Failed to get user info');
  }
}

// Fonction utilitaire pour attendre un certain temps (en ms)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour obtenir les serveurs de l'utilisateur avec gestion des limitations de taux
export async function getUserGuilds(accessToken, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      // Si l'erreur est due à une limitation de taux (429)
      if (error.response && error.response.status === 429) {
        const retryAfter = error.response.data.retry_after || 1;
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
        
        // Attendre le temps indiqué avant de réessayer
        await sleep(retryAfter * 1000);
        retries++;
        
        // Si nous avons encore des tentatives, continuer la boucle
        if (retries < maxRetries) {
          continue;
        }
      }
      
      console.error('Erreur lors de la récupération des serveurs:', error);
      
      // Si nous n'avons pas de serveurs, retourner un tableau vide plutôt que de lancer une erreur
      // Cela permettra à l'application de continuer à fonctionner
      return [];
    }
  }
  
  // Si nous avons épuisé toutes les tentatives, retourner un tableau vide
  return [];
}

// Fonction pour parser les cookies de la requête
export function parseCookies(req) {
  return cookie.parse(req.headers.cookie || '');
}

// Fonction pour définir les cookies de session
export function setAuthCookies(res, session) {
  if (!session || !session.access_token) {
    console.error('Session ou access_token manquant dans setAuthCookies');
    return;
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    path: '/',
  };

  // Créer les cookies individuellement
  const accessTokenCookie = cookie.serialize('discord_access_token', session.access_token, cookieOptions);
  const refreshTokenCookie = cookie.serialize('discord_refresh_token', session.refresh_token, cookieOptions);
  const expiryTokenCookie = cookie.serialize('discord_token_expiry', String(Date.now() + session.expires_in * 1000), cookieOptions);

  // Définir les cookies
  res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie, expiryTokenCookie]);
}

// Fonction pour vérifier si l'utilisateur est authentifié
export function isAuthenticated(req) {
  const cookies = parseCookies(req);
  const tokenExpiry = parseInt(cookies.discord_token_expiry || '0', 10);
  
  return cookies.discord_access_token && tokenExpiry > Date.now();
}

// Fonction pour rafraîchir le token
export async function refreshToken(refreshToken) {
  try {
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      redirect_uri: config.redirectUri,
      scope: config.scope,
    });

    const response = await axios.post(`${DISCORD_API}/oauth2/token`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    throw new Error('Failed to refresh token');
  }
}

export default {
  getAuthUrl,
  exchangeCode,
  getUserInfo,
  getUserGuilds,
  parseCookies,
  setAuthCookies,
  isAuthenticated,
  refreshToken,
};
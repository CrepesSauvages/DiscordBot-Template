import { exchangeCode, getUserInfo, getUserGuilds, setAuthCookies } from '../../../../lib/auth';

export default async function handler(req, res) {
  // Vérifier si c'est une requête GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Récupérer le code d'autorisation de l'URL
  const { code } = req.query;

  if (!code) {
    return res.redirect('/login?error=no_code');
  }

  try {
    // Échanger le code contre un token
    const tokenData = await exchangeCode(code);
    
    // Récupérer les informations de l'utilisateur
    const userData = await getUserInfo(tokenData.access_token);
    
    // Récupérer les serveurs de l'utilisateur
    const guildsData = await getUserGuilds(tokenData.access_token);
    
    // Définir les cookies de session
    setAuthCookies(res, tokenData);
    
    // Rediriger vers le dashboard
    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Erreur lors de l\'authentification:', error);
    return res.redirect('/login?error=auth_failed');
  }
}
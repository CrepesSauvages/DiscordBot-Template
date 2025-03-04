import { isAuthenticated } from '../../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vérifier si l'utilisateur est authentifié
  const authenticated = isAuthenticated(req);

  return res.status(200).json({ authenticated });
}
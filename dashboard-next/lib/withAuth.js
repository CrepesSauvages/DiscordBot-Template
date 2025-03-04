import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

// Liste des routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ['/login', '/api/auth/discord/callback'];

export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      // Ignorer la vérification pour les routes publiques
      if (publicRoutes.includes(router.pathname) || router.pathname.startsWith('/api/')) {
        setLoading(false);
        return;
      }

      // Vérifier si l'utilisateur est authentifié
      async function checkAuth() {
        try {
          const response = await axios.get('/api/auth/check');
          if (response.data.authenticated) {
            setIsAuthenticated(true);
          } else {
            // Rediriger vers la page de connexion
            router.push('/login');
          }
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'authentification:', error);
          // En cas d'erreur, rediriger vers la page de connexion
          router.push('/login');
        } finally {
          setLoading(false);
        }
      }

      checkAuth();
    }, [router]);

    // Afficher un état de chargement pendant la vérification
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-blurple"></div>
        </div>
      );
    }

    // Si c'est une route publique ou si l'utilisateur est authentifié, afficher le composant
    if (publicRoutes.includes(router.pathname) || isAuthenticated) {
      return <Component {...props} />;
    }

    // Sinon, ne rien afficher (la redirection est déjà en cours)
    return null;
  };
}

export default withAuth;
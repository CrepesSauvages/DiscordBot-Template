import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiLogIn } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getAuthUrl } from '../lib/auth';

export default function Login() {
  const router = useRouter();
  
  // Rediriger vers Discord OAuth si le paramètre 'code' est présent dans l'URL
  useEffect(() => {
    if (router.query.code) {
      router.push('/api/auth/discord/callback?code=' + router.query.code);
    }
  }, [router]);

  // Fonction pour rediriger vers l'URL d'authentification Discord
  const handleLogin = () => {
    window.location.href = getAuthUrl();
  };

  return (
    <>
      <Head>
        <title>Connexion | Discord Bot Dashboard</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-discord-dark">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-discord-dark-gray rounded-lg shadow-lg overflow-hidden"
        >
          <div className="bg-discord-blurple py-6 px-8 text-center">
            <h1 className="text-2xl font-bold text-white">Discord Bot Dashboard</h1>
            <p className="text-discord-light-gray mt-2">Connectez-vous pour accéder au dashboard</p>
          </div>
          
          <div className="p-8">
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Utilisez votre compte Discord pour vous connecter et gérer votre bot.
            </p>
            
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center bg-discord-blurple hover:bg-discord-blurple-dark text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              <FiLogIn className="mr-2" />
              Se connecter avec Discord
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
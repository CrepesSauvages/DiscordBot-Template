import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FaDiscord } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getAuthUrl } from '../lib/auth';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [authUrl, setAuthUrl] = useState('');

  useEffect(() => {
    // Générer l'URL d'authentification Discord
    const url = getAuthUrl();
    setAuthUrl(url);
    
    // Vérifier s'il y a une erreur dans l'URL
    if (router.query.error) {
      const errorType = router.query.error;
      
      if (errorType === 'auth_failed') {
        setError('L\'authentification a échoué. Veuillez réessayer.');
      } else if (errorType === 'backend_unavailable') {
        setError('Le serveur backend n\'est pas accessible. Assurez-vous qu\'il est en cours d\'exécution.');
      } else if (errorType === 'no_code') {
        setError('Aucun code d\'autorisation n\'a été reçu. Veuillez réessayer.');
      } else {
        setError('Une erreur s\'est produite. Veuillez réessayer.');
      }
    }
  }, [router.query]);

  const handleLogin = () => {
    if (authUrl) {
      window.location.href = authUrl;
    } else {
      setError('Impossible de générer l\'URL d\'authentification. Veuillez réessayer.');
    }
  };

  return (
    <>
      <Head>
        <title>Connexion - Dashboard Bot Discord</title>
        <meta name="description" content="Connectez-vous au dashboard de votre bot Discord" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-md"
        >
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Dashboard Bot Discord
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Connectez-vous avec Discord pour accéder au dashboard
            </p>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm mb-4">
              {error}
            </div>
          )}
          
          <div className="mt-8">
            <button
              onClick={handleLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <FaDiscord className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" />
              </span>
              Connexion avec Discord
            </button>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              En vous connectant, vous acceptez de partager vos informations Discord avec ce dashboard.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
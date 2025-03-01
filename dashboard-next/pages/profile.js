import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiUser, FiMail, FiTag, FiCalendar, FiShield } from 'react-icons/fi';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setLoading(true);
        const response = await axios.get('/api/user/profile');
        setUser(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement du profil:', err);
        
        // Si l'erreur est due à une non-authentification, rediriger vers la page de connexion
        if (err.response && err.response.status === 401) {
          router.push('/login');
          return;
        }
        
        setError('Impossible de charger votre profil. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserProfile();
  }, [router]);

  // Fonction pour formater la date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <>
      <Head>
        <title>Mon Profil | Discord Bot Dashboard</title>
      </Head>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mon Profil</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Consultez et gérez les informations de votre profil Discord
        </p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse bg-card rounded-lg p-6 h-64"></div>
      ) : user ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Carte de profil principale */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-lg overflow-hidden shadow-sm md:col-span-1"
          >
            <div className="bg-discord-blurple h-24"></div>
            <div className="px-6 py-4 flex flex-col items-center -mt-12">
              <img
                src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`}
                alt={`${user.username}'s avatar`}
                className="h-24 w-24 rounded-full border-4 border-white dark:border-discord-dark-gray bg-white dark:bg-discord-dark-gray"
              />
              <h2 className="text-xl font-bold mt-2">{user.username}</h2>
              <p className="text-gray-500 dark:text-gray-400">#{user.discriminator}</p>
              
              <div className="mt-4 w-full">
                <div className="flex items-center py-2">
                  <FiUser className="h-5 w-5 text-discord-blurple mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">ID: {user.id}</span>
                </div>
                <div className="flex items-center py-2">
                  <FiCalendar className="h-5 w-5 text-discord-blurple mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">Créé le: {formatDate(user.created_at)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Informations détaillées */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-lg overflow-hidden shadow-sm md:col-span-2"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informations du compte</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <FiTag className="h-5 w-5 text-discord-blurple mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nom d'utilisateur</p>
                    <p className="text-gray-800 dark:text-white">{user.username}#{user.discriminator}</p>
                  </div>
                </div>
                
                {user.email && (
                  <div className="flex items-center">
                    <FiMail className="h-5 w-5 text-discord-blurple mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-gray-800 dark:text-white">{user.email}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <FiShield className="h-5 w-5 text-discord-blurple mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Authentification à deux facteurs</p>
                    <p className="text-gray-800 dark:text-white">{user.mfa_enabled ? 'Activée' : 'Désactivée'}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-yellow-600 dark:text-yellow-400">
          Aucune information de profil disponible. Veuillez vous connecter.
        </div>
      )}
    </>
  );
}
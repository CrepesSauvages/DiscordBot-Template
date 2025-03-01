import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiSettings } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getUserServers } from '../../lib/api';

export function ServerList({ servers = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchServers() {
      try {
        setLoading(true);
        const data = await getUserServers();
        servers = data;
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des serveurs:', err);
        setError('Impossible de charger les serveurs. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    }

    if (!servers.length) {
      fetchServers();
    }
  }, [servers]);

  // Fonction pour obtenir l'URL de l'icône du serveur
  const getServerIcon = (server) => {
    if (server.icon) {
      return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`;
    }
    // Retourner une icône par défaut ou générer une image avec les initiales du serveur
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&background=random&color=fff&size=128`;
  };

  // Fonction pour afficher les initiales du serveur (pour les serveurs sans icône)
  const getServerInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Mes serveurs</h2>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-discord-blurple"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Mes serveurs</h2>
        <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Mes serveurs</h2>
      
      {servers.length === 0 ? (
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vous n'avez pas encore de serveurs avec le bot.
          </p>
          <Link 
            href="https://discord.com/api/oauth2/authorize?client_id=1014305078997422111&permissions=8&scope=bot%20applications.commands" 
            target="_blank"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-discord-blurple hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiPlus className="mr-2" /> Ajouter à un serveur
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.map((server) => (
            <motion.div 
              key={server.id}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
            >
              <div className="p-4 flex items-center">
                {server.icon ? (
                  <img 
                    src={getServerIcon(server)} 
                    alt={server.name} 
                    className="w-12 h-12 rounded-full mr-4"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold mr-4">
                    {getServerInitials(server.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                    {server.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {server.botIn ? 'Bot présent' : 'Bot non installé'}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex justify-between">
                {server.botIn ? (
                  <Link 
                    href={`/servers/${server.id}`}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-discord-blurple hover:bg-indigo-700"
                  >
                    <FiSettings className="mr-1" /> Gérer
                  </Link>
                ) : (
                  <Link 
                    href={`https://discord.com/api/oauth2/authorize?client_id=1014305078997422111&permissions=8&scope=bot%20applications.commands&guild_id=${server.id}`}
                    target="_blank"
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <FiPlus className="mr-1" /> Installer
                  </Link>
                )}
                
                <a 
                  href={`https://discord.com/channels/${server.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Ouvrir
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
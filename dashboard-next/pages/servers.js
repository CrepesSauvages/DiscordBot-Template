import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiServer, FiPlus, FiExternalLink } from 'react-icons/fi';
import axios from 'axios';

export default function Servers() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchServers() {
      try {
        setLoading(true);
        const response = await axios.get('/api/guilds');
        setServers(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement des serveurs:', err);
        setError('Impossible de charger vos serveurs. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchServers();
  }, []);

  // Fonction pour inviter le bot sur un serveur
  const inviteBot = () => {
    window.open(process.env.NEXT_PUBLIC_BOT_INVITE_URL || 'https://discord.com/oauth2/authorize?client_id=1014305078997422111&permissions=8&scope=bot%20applications.commands', '_blank');
  };

  return (
    <>
      <Head>
        <title>Mes Serveurs | Discord Bot Dashboard</title>
      </Head>
      
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mes Serveurs</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez les paramètres de vos serveurs Discord
          </p>
        </div>
        
        <button
          onClick={inviteBot}
          className="bg-discord-blurple hover:bg-discord-blurple-dark text-white px-4 py-2 rounded-md flex items-center"
        >
          <FiPlus className="mr-2" />
          Ajouter à un serveur
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg p-6 h-32"></div>
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-yellow-600 dark:text-yellow-400">
          Vous n'avez pas encore de serveurs où vous êtes administrateur. Vous devez avoir les permissions d'administrateur sur un serveur pour pouvoir le gérer.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {servers.map(server => (
            <div
              key={server.id}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {server.icon ? (
                    <img 
                      src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`} 
                      alt={`${server.name} icon`} 
                      className="w-12 h-12 rounded-full mr-4"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-discord-blurple/10 flex items-center justify-center mr-4">
                      <FiServer className="h-6 w-6 text-discord-blurple" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{server.name}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {server.botIn ? 'Bot présent' : 'Bot non présent'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between">
                  {server.botIn ? (
                    <Link href={`/servers/${server.id}`} className="bg-discord-blurple hover:bg-discord-blurple-dark text-white px-4 py-2 rounded-md flex items-center">
                      Gérer
                    </Link>
                  ) : (
                    <button
                      onClick={inviteBot}
                      className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md flex items-center"
                    >
                      <FiPlus className="mr-2" />
                      Ajouter le bot
                    </button>
                  )}
                  
                  <a 
                    href={`https://discord.com/channels/${server.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1"
                  >
                    <FiExternalLink className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
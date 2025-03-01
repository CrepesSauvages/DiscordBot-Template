import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiServer, FiUsers, FiMessageCircle, FiCommand } from 'react-icons/fi';
import { StatsCard } from '../components/dashboard/StatsCard';
import { ServerList } from '../components/dashboard/ServerList';
import { getBotStats, getUserServers } from '../lib/api';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [stats, setStats] = useState({
    servers: 0,
    users: 0,
    messages: 0,
    commands: 0
  });
  
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Récupérer les statistiques du bot
        const statsData = await getBotStats();
        setStats({
          servers: statsData.servers || 0,
          users: statsData.users || 0,
          messages: statsData.messages || 0,
          commands: statsData.commands || 0
        });
        
        // Récupérer les serveurs de l'utilisateur
        const serversData = await getUserServers();
        setServers(serversData);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        
        // Si l'erreur est due à une non-authentification, rediriger vers la page de connexion
        if (error.response && error.response.status === 401) {
          router.push('/login');
          return;
        }
        
        setError("Impossible de charger les données. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [router]);

  return (
    <>
      <Head>
        <title>Dashboard | Discord Bot</title>
      </Head>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gérez votre bot Discord et consultez les statistiques
        </p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-blurple"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatsCard 
              icon={<FiServer className="w-6 h-6 text-discord-blurple" />}
              label="Serveurs"
              value={stats.servers}
              color="bg-blue-50 dark:bg-blue-900/20"
            />
            <StatsCard 
              icon={<FiUsers className="w-6 h-6 text-discord-green" />}
              label="Membres"
              value={stats.users}
              color="bg-green-50 dark:bg-green-900/20"
            />
            <StatsCard 
              icon={<FiMessageCircle className="w-6 h-6 text-discord-yellow" />}
              label="Messages"
              value={stats.messages}
              color="bg-yellow-50 dark:bg-yellow-900/20"
            />
            <StatsCard 
              icon={<FiCommand className="w-6 h-6 text-discord-fuchsia" />}
              label="Commandes"
              value={stats.commands}
              color="bg-pink-50 dark:bg-pink-900/20"
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Mes serveurs</h2>
            <ServerList servers={servers} />
          </div>
        </>
      )}
    </>
  );
}
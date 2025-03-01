import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FiHome, 
  FiServer, 
  FiCommand, 
  FiSettings, 
  FiUsers, 
  FiMessageSquare,
  FiShield,
  FiHelpCircle,
  FiChevronRight,
  FiChevronDown
} from 'react-icons/fi';
import { getUserServers } from '../../lib/api';

export function Sidebar() {
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState({
    servers: true,
    settings: false
  });
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServers() {
      try {
        const serversData = await getUserServers();
        setServers(serversData);
      } catch (error) {
        console.error('Erreur lors de la récupération des serveurs:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchServers();
  }, []);

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const isActive = (path) => {
    return router.pathname === path;
  };

  // Prendre seulement les 3 premiers serveurs
  const displayedServers = servers.slice(0, 3);

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-gray-50 dark:bg-discord-darker-gray border-r border-gray-200 dark:border-gray-800">
        <div className="h-0 flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Main navigation */}
          <nav className="mt-5 px-2 space-y-1">
            <Link 
              href="/dashboard" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard')
                  ? 'bg-discord-blurple text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-discord-light-gray'
              }`}
            >
              <FiHome className="mr-3 h-5 w-5" />
              Dashboard
            </Link>

            {/* Servers Section */}
            <div>
              <button
                onClick={() => toggleMenu('servers')}
                className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-discord-light-gray"
              >
                <div className="flex items-center">
                  <FiServer className="mr-3 h-5 w-5" />
                  <span>Mes serveurs</span>
                </div>
                {openMenus.servers ? (
                  <FiChevronDown className="h-4 w-4" />
                ) : (
                  <FiChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {openMenus.servers && (
                <div className="ml-8 mt-1 space-y-1">
                  {loading ? (
                    <div className="px-2 py-2 text-sm text-gray-500">Chargement...</div>
                  ) : displayedServers.length > 0 ? (
                    <>
                      {displayedServers.map(server => (
                        <Link 
                          key={server.id}
                          href={`/servers/${server.id}`}
                          className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-discord-light-gray"
                        >
                          <span className="truncate">{server.name}</span>
                        </Link>
                      ))}
                      {servers.length > 3 && (
                        <Link 
                          href="/servers"
                          className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-discord-blurple"
                        >
                          <span className="truncate">Voir tous les serveurs</span>
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="px-2 py-2 text-sm text-gray-500">
                      Aucun serveur disponible
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link 
              href="/commands" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive('/commands')
                  ? 'bg-discord-blurple text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-discord-light-gray'
              }`}
            >
              <FiCommand className="mr-3 h-5 w-5" />
              Commandes
            </Link>

            <Link 
              href="/moderation" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive('/moderation')
                  ? 'bg-discord-blurple text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-discord-light-gray'
              }`}
            >
              <FiShield className="mr-3 h-5 w-5" />
              Modération
            </Link>

            <Link 
              href="/members" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive('/members')
                  ? 'bg-discord-blurple text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-discord-light-gray'
              }`}
            >
              <FiUsers className="mr-3 h-5 w-5" />
              Membres
            </Link>

            <Link 
              href="/messages" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive('/messages')
                  ? 'bg-discord-blurple text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-discord-light-gray'
              }`}
            >
              <FiMessageSquare className="mr-3 h-5 w-5" />
              Messages
            </Link>

            {/* Settings Section */}
            <div>
              <button
                onClick={() => toggleMenu('settings')}
                className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-discord-light-gray"
              >
                <div className="flex items-center">
                  <FiSettings className="mr-3 h-5 w-5" />
                  <span>Paramètres</span>
                </div>
                {openMenus.settings ? (
                  <FiChevronDown className="h-4 w-4" />
                ) : (
                  <FiChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {openMenus.settings && (
                <div className="ml-8 mt-1 space-y-1">
                  <Link 
                    href="/profile"
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-discord-light-gray"
                  >
                    <span className="truncate">Profil</span>
                  </Link>
                  <Link 
                    href="/settings/bot"
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-discord-light-gray"
                  >
                    <span className="truncate">Configuration du bot</span>
                  </Link>
                  <Link 
                    href="/settings/appearance"
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-discord-light-gray"
                  >
                    <span className="truncate">Apparence</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Help section */}
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-800 p-4">
          <Link href="/help" className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <FiHelpCircle className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Centre d'aide
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiSearch, FiFilter, FiCommand, FiInfo, FiShield, FiUsers, FiMessageCircle, FiSettings } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getCommands } from '../lib/api';
import { useRouter } from 'next/router';

export default function Commands() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchCommands() {
      try {
        setLoading(true);
        const data = await getCommands();
        
        // Si aucune commande n'est retournée, utiliser des données de démonstration
        if (!data || data.length === 0) {
          const mockCommands = [
            {
              id: '1',
              name: 'help',
              description: 'Affiche la liste des commandes disponibles',
              usage: '/help [commande]',
              category: 'Général',
              icon: <FiInfo className="h-5 w-5" />
            },
            {
              id: '2',
              name: 'ban',
              description: 'Bannir un utilisateur du serveur',
              usage: '/ban @utilisateur [raison]',
              category: 'Modération',
              icon: <FiShield className="h-5 w-5" />
            },
            {
              id: '3',
              name: 'kick',
              description: 'Expulser un utilisateur du serveur',
              usage: '/kick @utilisateur [raison]',
              category: 'Modération',
              icon: <FiShield className="h-5 w-5" />
            },
            {
              id: '4',
              name: 'warn',
              description: 'Avertir un utilisateur',
              usage: '/warn @utilisateur [raison]',
              category: 'Modération',
              icon: <FiShield className="h-5 w-5" />
            },
            {
              id: '5',
              name: 'profile',
              description: 'Affiche le profil d\'un utilisateur',
              usage: '/profile [@utilisateur]',
              category: 'Utilisateurs',
              icon: <FiUsers className="h-5 w-5" />
            },
            {
              id: '6',
              name: 'server',
              description: 'Affiche les informations du serveur',
              usage: '/server',
              category: 'Général',
              icon: <FiInfo className="h-5 w-5" />
            },
            {
              id: '7',
              name: 'clear',
              description: 'Supprime un nombre spécifié de messages',
              usage: '/clear [nombre]',
              category: 'Modération',
              icon: <FiMessageCircle className="h-5 w-5" />
            },
            {
              id: '8',
              name: 'config',
              description: 'Configure les paramètres du bot',
              usage: '/config [paramètre] [valeur]',
              category: 'Configuration',
              icon: <FiSettings className="h-5 w-5" />
            }
          ];
          setCommands(mockCommands);
        } else {
          // Transformer les données de l'API pour inclure les icônes
          const commandsWithIcons = data.map((cmd, index) => {
            let icon = <FiCommand className="h-5 w-5" />;
            
            // Assigner des icônes en fonction de la catégorie
            if (cmd.category) {
              switch(cmd.category.toLowerCase()) {
                case 'modération':
                  icon = <FiShield className="h-5 w-5" />;
                  break;
                case 'utilisateurs':
                  icon = <FiUsers className="h-5 w-5" />;
                  break;
                case 'configuration':
                  icon = <FiSettings className="h-5 w-5" />;
                  break;
                case 'général':
                  icon = <FiInfo className="h-5 w-5" />;
                  break;
                default:
                  icon = <FiCommand className="h-5 w-5" />;
              }
            }
            
            return {
              ...cmd,
              id: cmd.id || `cmd-${index}`,
              icon
            };
          });
          
          setCommands(commandsWithIcons);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des commandes:', err);
        
        // Si l'erreur est due à une non-authentification, rediriger vers la page de connexion
        if (err.response && err.response.status === 401) {
          router.push('/login');
          return;
        }
        
        setError('Impossible de charger les commandes. Veuillez réessayer plus tard.');
        
        // Utiliser les données de démonstration en cas d'erreur
        const mockCommands = [
          {
            id: '1',
            name: 'help',
            description: 'Affiche la liste des commandes disponibles',
            usage: '/help [commande]',
            category: 'Général',
            icon: <FiInfo className="h-5 w-5" />
          },
          {
            id: '2',
            name: 'ban',
            description: 'Bannir un utilisateur du serveur',
            usage: '/ban @utilisateur [raison]',
            category: 'Modération',
            icon: <FiShield className="h-5 w-5" />
          }
        ];
        setCommands(mockCommands);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCommands();
  }, [router]);

  const filteredCommands = commands.filter(command => {
    // Vérifier si les propriétés existent avant d'appeler toLowerCase()
    const commandName = command.name || '';
    const commandDesc = command.description || '';
    
    const matchesSearch = 
      commandName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      commandDesc.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = categoryFilter === 'all' || command.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Obtenir les catégories uniques pour le filtre
  const categories = ['all', ...new Set(commands.map(command => command.category))];

  // Fonction pour obtenir la couleur de fond en fonction de la catégorie
  const getCategoryColor = (category) => {
    switch(category) {
      case 'Modération':
        return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      case 'Utilisateurs':
        return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'Configuration':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400';
      case 'Général':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <>
      <Head>
        <title>Commandes | Discord Bot Dashboard</title>
      </Head>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Commandes</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Explorez et configurez les commandes disponibles pour votre bot Discord
        </p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher une commande..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-discord-light-gray text-gray-900 dark:text-white focus:outline-none focus:ring-discord-blurple focus:border-discord-blurple"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-discord-light-gray text-gray-900 dark:text-white focus:outline-none focus:ring-discord-blurple focus:border-discord-blurple"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Toutes les catégories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des commandes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-card rounded-lg p-6 h-32"></div>
          ))}
        </div>
      ) : filteredCommands.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-yellow-600 dark:text-yellow-400">
          Aucune commande ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCommands.map(command => (
            <motion.div
              key={command.id || command.name}
              whileHover={{ y: -5 }}
              className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-discord-blurple/10 mr-3">
                    {command.icon || <FiCommand className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">/{command.name || "undefined"}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(command.category)}`}>
                      {command.category || "Général"}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {command.description || "Pas de description disponible"}
                </p>
                
                <div className="bg-gray-100 dark:bg-discord-light-gray rounded p-2">
                  <code className="text-sm font-mono">
                    {command.usage || `/${command.name || "undefined"}`}
                  </code>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
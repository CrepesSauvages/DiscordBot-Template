import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiSearch, FiFilter, FiShield, FiUser, FiCalendar, FiMessageSquare, FiAlertCircle, FiUserX, FiUserMinus } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function Moderation() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [serverFilter, setServerFilter] = useState('all');

  useEffect(() => {
    // Simuler le chargement des cas de modération
    setTimeout(() => {
      const mockCases = [
        {
          id: '1',
          type: 'warn',
          user: {
            id: '123456789',
            username: 'User123',
            avatar: 'https://cdn.discordapp.com/avatars/123456789/abcdef.png'
          },
          moderator: {
            id: '987654321',
            username: 'Mod456',
            avatar: 'https://cdn.discordapp.com/avatars/987654321/fedcba.png'
          },
          server: {
            id: '123456789',
            name: 'Serveur de développement'
          },
          reason: 'Langage inapproprié',
          timestamp: new Date('2025-02-28T14:30:00').getTime(),
          active: true
        },
        {
          id: '2',
          type: 'mute',
          user: {
            id: '234567891',
            username: 'User234',
            avatar: null
          },
          moderator: {
            id: '987654321',
            username: 'Mod456',
            avatar: 'https://cdn.discordapp.com/avatars/987654321/fedcba.png'
          },
          server: {
            id: '123456789',
            name: 'Serveur de développement'
          },
          reason: 'Spam dans le chat',
          timestamp: new Date('2025-02-27T10:15:00').getTime(),
          duration: '2h',
          active: false
        },
        {
          id: '3',
          type: 'kick',
          user: {
            id: '345678912',
            username: 'User345',
            avatar: 'https://cdn.discordapp.com/avatars/345678912/123456.png'
          },
          moderator: {
            id: '987654321',
            username: 'Mod456',
            avatar: 'https://cdn.discordapp.com/avatars/987654321/fedcba.png'
          },
          server: {
            id: '987654321',
            name: 'Communauté Gaming'
          },
          reason: 'Violation des règles du serveur',
          timestamp: new Date('2025-02-26T18:45:00').getTime(),
          active: true
        },
        {
          id: '4',
          type: 'ban',
          user: {
            id: '456789123',
            username: 'User456',
            avatar: 'https://cdn.discordapp.com/avatars/456789123/654321.png'
          },
          moderator: {
            id: '987654321',
            username: 'Mod456',
            avatar: 'https://cdn.discordapp.com/avatars/987654321/fedcba.png'
          },
          server: {
            id: '987654321',
            name: 'Communauté Gaming'
          },
          reason: 'Comportement toxique répété',
          timestamp: new Date('2025-02-25T09:30:00').getTime(),
          duration: 'Permanent',
          active: true
        }
      ];
      
      setCases(mockCases);
      setLoading(false);
    }, 1000);
  }, []);

  // Filtrer les cas en fonction du terme de recherche, du type et du serveur
  const filteredCases = cases.filter(modCase => {
    const matchesSearch = modCase.user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         modCase.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || modCase.type === typeFilter;
    const matchesServer = serverFilter === 'all' || modCase.server.id === serverFilter;
    return matchesSearch && matchesType && matchesServer;
  });

  // Obtenir les types uniques pour le filtre
  const types = ['all', ...new Set(cases.map(modCase => modCase.type))];
  
  // Obtenir les serveurs uniques pour le filtre
  const servers = ['all', ...new Set(cases.map(modCase => modCase.server.id))];

  // Fonction pour formater la date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour obtenir l'icône en fonction du type de cas
  const getTypeIcon = (type) => {
    switch(type) {
      case 'warn':
        return <FiAlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'mute':
        return <FiMessageSquare className="h-5 w-5 text-purple-500" />;
      case 'kick':
        return <FiUserMinus className="h-5 w-5 text-orange-500" />;
      case 'ban':
        return <FiUserX className="h-5 w-5 text-red-500" />;
      default:
        return <FiShield className="h-5 w-5 text-gray-500" />;
    }
  };

  // Fonction pour obtenir la couleur de la pastille en fonction du type de cas
  const getTypeBadgeColor = (type) => {
    switch(type) {
      case 'warn':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400';
      case 'mute':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400';
      case 'kick':
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400';
      case 'ban':
        return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <>
      <Head>
        <title>Modération | Discord Bot Dashboard</title>
      </Head>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Modération</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gérez les actions de modération sur vos serveurs Discord
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un utilisateur ou une raison..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-discord-light-gray text-gray-900 dark:text-white focus:outline-none focus:ring-discord-blurple focus:border-discord-blurple"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative w-full sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-discord-light-gray text-gray-900 dark:text-white focus:outline-none focus:ring-discord-blurple focus:border-discord-blurple"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {types.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Tous les types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-discord-light-gray text-gray-900 dark:text-white focus:outline-none focus:ring-discord-blurple focus:border-discord-blurple"
            value={serverFilter}
            onChange={(e) => setServerFilter(e.target.value)}
          >
            {servers.map(serverId => (
              <option key={serverId} value={serverId}>
                {serverId === 'all' ? 'Tous les serveurs' : cases.find(c => c.server.id === serverId)?.server.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des cas de modération */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-card rounded-lg p-6 h-32"></div>
          ))}
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-yellow-600 dark:text-yellow-400">
          Aucun cas de modération ne correspond à votre recherche.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCases.map(modCase => (
            <motion.div
              key={modCase.id}
              whileHover={{ y: -3 }}
              className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center">
                    {/* Avatar de l'utilisateur */}
                    {modCase.user.avatar ? (
                      <img 
                        src={modCase.user.avatar} 
                        alt={modCase.user.username} 
                        className="w-10 h-10 rounded-full mr-4"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-discord-blurple text-white flex items-center justify-center mr-4">
                        {modCase.user.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-semibold">{modCase.user.username}</h3>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(modCase.type)}`}>
                          {getTypeIcon(modCase.type)}
                          <span className="ml-1 capitalize">{modCase.type}</span>
                        </span>
                        {modCase.active ? (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                            Actif
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400">
                            Expiré
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FiCalendar className="mr-1 h-4 w-4" />
                      {formatDate(modCase.timestamp)}
                    </div>
                    <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <FiUser className="mr-1 h-4 w-4" />
                      Par {modCase.moderator.username}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Serveur:</span> {modCase.server.name}
                  </div>
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Raison:</span> {modCase.reason}
                  </div>
                  {modCase.duration && (
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Durée:</span> {modCase.duration}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-end space-x-2">
                  {modCase.active && (
                    <button className="px-3 py-1 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40">
                      Annuler
                    </button>
                  )}
                  <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-discord-light-gray text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-discord-light-gray/90">
                    Détails
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
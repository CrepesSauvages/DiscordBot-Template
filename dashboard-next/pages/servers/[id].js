// Fichier: pages/servers/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiSave, FiArrowLeft, FiSettings, FiMessageSquare, FiShield, FiGlobe } from 'react-icons/fi';
import axios from 'axios';

// TEMPORAIRE: Données de test pour le développement
const testServerData = {
  id: "701043063736238081",
  name: "Serveur Discord Test",
  icon: null,
  memberCount: 150,
  owner: {
    id: '123456789012345678',
    tag: 'Owner#1234'
  },
  channels: [
    { id: '111111111111111111', name: 'général', type: 0 },
    { id: '222222222222222222', name: 'annonces', type: 0 },
    { id: '333333333333333333', name: 'logs', type: 0 },
    { id: '444444444444444444', name: 'salon-vocal-1', type: 2 },
    { id: '555555555555555555', name: 'salon-vocal-2', type: 2 }
  ],
  roles: [
    { id: '666666666666666666', name: '@everyone', color: '#000000' },
    { id: '777777777777777777', name: 'Admin', color: '#FF0000' },
    { id: '888888888888888888', name: 'Modérateur', color: '#00FF00' },
    { id: '999999999999999999', name: 'Membre', color: '#0000FF' }
  ]
};

const testSettings = {
  prefix: '!',
  locale: 'fr',
  logChannel: '333333333333333333',
  welcomeChannel: '222222222222222222',
  welcomeMessage: 'Bienvenue {user} sur {server}!',
  leaveMessage: 'Au revoir {user}!',
  autoRole: '999999999999999999',
  modLogChannel: '333333333333333333',
  muteRole: '888888888888888888'
};

// Configuration pour activer/désactiver les données de test
const USE_TEST_DATA = false;

export default function ServerSettings() {
  const router = useRouter();
  const { id } = router.query;
  
  const [server, setServer] = useState(null);
  const [settings, setSettings] = useState({
    prefix: '!',
    locale: 'fr',
    logChannel: '',
    welcomeChannel: '',
    welcomeMessage: 'Bienvenue {user} sur {server}!',
    leaveMessage: 'Au revoir {user}!',
    autoRole: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (!id) return;
    
    async function fetchServerData() {
      try {
        setLoading(true);
        
        if (USE_TEST_DATA) {
          // Utiliser les données de test
          setServer(testServerData);
          setSettings(prevSettings => ({
            ...prevSettings,
            ...testSettings
          }));
        } else {
          // Récupérer les informations du serveur
          const serverResponse = await axios.get(`/api/guilds/${id}`);
          setServer(serverResponse.data);
          
          // Récupérer les paramètres du serveur
          const settingsResponse = await axios.get(`/api/guilds/${id}/settings`);
          
          // Fusionner les paramètres par défaut avec ceux récupérés
          setSettings(prevSettings => ({
            ...prevSettings,
            ...settingsResponse.data
          }));
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données du serveur:', err);
        setError('Impossible de charger les données du serveur. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchServerData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await axios.post(`/api/guilds/${id}/settings`, settings);
      
      setSuccess('Paramètres enregistrés avec succès!');
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des paramètres:', err);
      setError('Impossible d\'enregistrer les paramètres. Veuillez réessayer plus tard.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-blurple"></div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-yellow-600 dark:text-yellow-400">
        Serveur non trouvé ou vous n'avez pas les permissions nécessaires.
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{server.name} | Discord Bot Dashboard</title>
      </Head>
      
      <div className="mb-8">
        <button 
          onClick={() => router.push('/servers')}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center mb-4"
        >
          <FiArrowLeft className="mr-2" />
          Retour aux serveurs
        </button>
        
        <div className="flex items-center">
          {server.icon ? (
            <img 
              src={server.icon} 
              alt={`${server.name} icon`} 
              className="w-16 h-16 rounded-full mr-4"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-discord-blurple/10 flex items-center justify-center mr-4">
              <FiSettings className="h-8 w-8 text-discord-blurple" />
            </div>
          )}
          
          <div>
            <h1 className="text-3xl font-bold">{server.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {server.memberCount} membres
            </p>
          </div>
        </div>
      </div>

      {/* Messages d'erreur et de succès */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400 mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-green-600 dark:text-green-400 mb-6">
          {success}
        </div>
      )}

      {/* Onglets */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'general'
                  ? 'text-discord-blurple border-discord-blurple'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('general')}
            >
              <FiSettings className="inline mr-2" />
              Général
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'messages'
                  ? 'text-discord-blurple border-discord-blurple'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('messages')}
            >
              <FiMessageSquare className="inline mr-2" />
              Messages
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'moderation'
                  ? 'text-discord-blurple border-discord-blurple'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('moderation')}
            >
              <FiShield className="inline mr-2" />
              Modération
            </button>
          </li>
        </ul>
      </div>

      {/* Formulaire de paramètres */}
      <form onSubmit={handleSubmit}>
        {/* Onglet Général */}
        {activeTab === 'general' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Paramètres généraux</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Préfixe de commande
                </label>
                <input
                  type="text"
                  name="prefix"
                  value={settings.prefix}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-discord-blurple focus:border-discord-blurple dark:bg-gray-700"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Le préfixe utilisé pour les commandes textuelles (ex: !help)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Langue
                </label>
                <select
                  name="locale"
                  value={settings.locale}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-discord-blurple focus:border-discord-blurple dark:bg-gray-700"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  La langue utilisée par le bot sur ce serveur
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Onglet Messages */}
        {activeTab === 'messages' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Messages et notifications</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Salon de logs
                </label>
                <select
                  name="logChannel"
                  value={settings.logChannel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-discord-blurple focus:border-discord-blurple dark:bg-gray-700"
                >
                  <option value="">Aucun</option>
                  {server.channels
                    .filter(channel => channel.type === 0) // Filtrer pour n'avoir que les salons textuels
                    .map(channel => (
                      <option key={channel.id} value={channel.id}>
                        #{channel.name}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Le salon où seront envoyés les logs du serveur
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Salon de bienvenue
                </label>
                <select
                  name="welcomeChannel"
                  value={settings.welcomeChannel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-discord-blurple focus:border-discord-blurple dark:bg-gray-700"
                >
                  <option value="">Aucun</option>
                  {server.channels
                    .filter(channel => channel.type === 0) // Filtrer pour n'avoir que les salons textuels
                    .map(channel => (
                      <option key={channel.id} value={channel.id}>
                        #{channel.name}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Le salon où seront envoyés les messages de bienvenue et de départ
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message de bienvenue
                </label>
                <textarea
                  name="welcomeMessage"
                  value={settings.welcomeMessage}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-discord-blurple focus:border-discord-blurple dark:bg-gray-700"
                ></textarea>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Message envoyé quand un utilisateur rejoint le serveur. Utilisez {'{user}'} pour mentionner l'utilisateur et {'{server}'} pour le nom du serveur.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message de départ
                </label>
                <textarea
                  name="leaveMessage"
                  value={settings.leaveMessage}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-discord-blurple focus:border-discord-blurple dark:bg-gray-700"
                ></textarea>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Message envoyé quand un utilisateur quitte le serveur. Utilisez {'{user}'} pour le nom de l'utilisateur.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Onglet Modération */}
        {activeTab === 'moderation' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Paramètres de modération</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rôle automatique
                </label>
                <select
                  name="autoRole"
                  value={settings.autoRole}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-discord-blurple focus:border-discord-blurple dark:bg-gray-700"
                >
                  <option value="">Aucun</option>
                  {server.roles
                    .filter(role => role.name !== '@everyone')
                    .map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Rôle attribué automatiquement aux nouveaux membres
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-discord-blurple hover:bg-discord-blurple-dark text-white px-6 py-3 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
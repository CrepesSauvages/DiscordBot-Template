import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiMoon, FiSun, FiMenu, FiX, FiBell, FiSettings, FiUser, FiLogOut } from 'react-icons/fi';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useRouter } from 'next/router';

export function Navbar({ darkMode, setDarkMode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Récupérer les informations de l'utilisateur
    async function fetchUserInfo() {
      try {
        const response = await axios.get('/api/user/profile');
        setUser(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations utilisateur:', error);
      }
    }

    fetchUserInfo();
  }, []);

  // Fonction pour se déconnecter
  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <nav className="bg-white dark:bg-discord-dark-gray border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <img
                className="h-8 w-auto"
                src="/images/logo.png"
                alt="Discord Bot Logo"
              />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">BotDashboard</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-discord-light-gray">
              Dashboard
            </Link>
            <Link href="/servers" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-discord-light-gray">
              Serveurs
            </Link>
            <Link href="/commands" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-discord-light-gray">
              Commandes
            </Link>
          </div>

          <div className="flex items-center">
            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none"
            >
              {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>

            {/* Notifications */}
            <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none">
              <FiBell className="h-5 w-5" />
            </button>

            {/* Profile dropdown */}
            <div className="ml-3 relative">
              <div>
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-discord-blurple"
                >
                  {user ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`}
                      alt={`${user.username}'s avatar`}
                    />
                  ) : (
                    <img
                      className="h-8 w-8 rounded-full"
                      src="https://cdn.discordapp.com/embed/avatars/0.png"
                      alt="User avatar"
                    />
                  )}
                </button>
              </div>
              
              {/* Profile dropdown menu */}
              {profileMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-discord-light-gray ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                >
                  <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-discord-dark-gray">
                    <FiUser className="mr-2 h-4 w-4" />
                    Mon Profil
                  </Link>
                  <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-discord-dark-gray">
                    <FiSettings className="mr-2 h-4 w-4" />
                    Paramètres
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-discord-dark-gray"
                  >
                    <FiLogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </button>
                </motion.div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden ml-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <FiX className="block h-6 w-6" />
                ) : (
                  <FiMenu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white dark:bg-discord-dark-gray"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-discord-light-gray">
              Dashboard
            </Link>
            <Link href="/servers" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-discord-light-gray">
              Serveurs
            </Link>
            <Link href="/commands" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-discord-light-gray">
              Commandes
            </Link>
            <Link href="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-discord-light-gray">
              Mon Profil
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
import { useState } from 'react';
import Link from 'next/link';
import { FiMoon, FiSun, FiMenu, FiX, FiBell, FiSettings } from 'react-icons/fi';
import { motion } from 'framer-motion';

export function Navbar({ darkMode, setDarkMode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

            {/* Settings */}
            <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none">
              <FiSettings className="h-5 w-5" />
            </button>

            {/* Profile dropdown */}
            <div className="ml-3 relative">
              <div>
                <button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-discord-blurple">
                  <img
                    className="h-8 w-8 rounded-full"
                    src="https://cdn.discordapp.com/embed/avatars/0.png"
                    alt="User avatar"
                  />
                </button>
              </div>
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
          </div>
        </motion.div>
      )}
    </nav>
  );
}
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowRight, FiServer, FiUsers, FiMessageCircle, FiCommand } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <>
      <Head>
        <title>Discord Bot Dashboard</title>
        <meta name="description" content="Dashboard pour gérer votre bot Discord" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <div className="bg-discord-blurple dark:bg-discord-darker-gray relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl"
                >
                  <span className="block">Gérez votre</span>
                  <span className="block text-indigo-200">Bot Discord</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mt-3 text-base text-indigo-200 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl"
                >
                  Une interface intuitive pour configurer, surveiller et gérer votre bot Discord. Accédez à des statistiques détaillées et personnalisez les fonctionnalités en quelques clics.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0"
                >
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 justify-center lg:justify-start">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-discord-blurple bg-white hover:bg-gray-50"
                    >
                      Accéder au Dashboard
                      <FiArrowRight className="ml-2 -mr-1 h-5 w-5" />
                    </Link>
                    <a
                      href="https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Ajouter à Discord
                    </a>
                  </div>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
              >
                <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                  <div className="relative block w-full bg-white dark:bg-discord-dark-gray rounded-lg overflow-hidden">
                    <img
                      className="w-full"
                      src="/images/dashboard-preview.png"
                      alt="Dashboard Preview"
                    />
                    <div className="absolute inset-0 bg-discord-blurple mix-blend-multiply opacity-10"></div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-white dark:bg-discord-darker-gray">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-base font-semibold text-discord-blurple uppercase tracking-wide">Fonctionnalités</h2>
              <p className="mt-1 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight">
                Tout ce dont vous avez besoin
              </p>
              <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500 dark:text-gray-400">
                Notre dashboard offre tout ce qu'il faut pour gérer efficacement votre bot Discord.
              </p>
            </div>

            <div className="mt-12">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <motion.div
                  whileHover={{ y: -5 }}
                  className="pt-6"
                >
                  <div className="flow-root bg-card rounded-lg px-6 pb-8">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-discord-blurple rounded-md shadow-lg">
                          <FiServer className="h-6 w-6 text-white" />
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">Gestion des serveurs</h3>
                      <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                        Gérez facilement tous vos serveurs Discord depuis une interface unique et intuitive.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5 }}
                  className="pt-6"
                >
                  <div className="flow-root bg-card rounded-lg px-6 pb-8">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-discord-green rounded-md shadow-lg">
                          <FiUsers className="h-6 w-6 text-white" />
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">Modération avancée</h3>
                      <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                        Outils de modération puissants pour maintenir vos serveurs sécurisés et bien organisés.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5 }}
                  className="pt-6"
                >
                  <div className="flow-root bg-card rounded-lg px-6 pb-8">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-discord-yellow rounded-md shadow-lg">
                          <FiMessageCircle className="h-6 w-6 text-white" />
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">Statistiques détaillées</h3>
                      <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                        Suivez l'activité de votre serveur avec des statistiques complètes et des graphiques intuitifs.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -5 }}
                  className="pt-6"
                >
                  <div className="flow-root bg-card rounded-lg px-6 pb-8">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-discord-fuchsia rounded-md shadow-lg">
                          <FiCommand className="h-6 w-6 text-white" />
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">Commandes personnalisables</h3>
                      <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                        Créez et personnalisez des commandes pour votre bot sans avoir à écrire de code.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-discord-blurple dark:bg-discord-dark-gray">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Prêt à améliorer votre serveur Discord?</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-indigo-200">
              Commencez dès maintenant à utiliser notre bot et son dashboard intuitif.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-discord-blurple bg-white hover:bg-gray-50 sm:w-auto"
            >
              Commencer maintenant
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white dark:bg-discord-darker-gray">
          <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
            <p className="mt-8 text-center text-base text-gray-500 dark:text-gray-400">
              &copy; 2025 Discord Bot Dashboard. Tous droits réservés.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
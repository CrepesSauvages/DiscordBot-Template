const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Middleware d'authentification
 * Vérifie si l'utilisateur est authentifié avant d'accéder aux routes protégées
 */
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Non authentifié' });
}

/**
 * Middleware pour vérifier les permissions sur un serveur
 * Vérifie si l'utilisateur a les permissions nécessaires pour gérer le serveur
 */
function hasGuildPermissions(req, res, next) {
    const { id } = req.params;
    
    // Vérifier si l'utilisateur a accès à ce serveur (MANAGE_GUILD permission)
    const userGuild = req.user.guilds.find(g => g.id === id && (g.permissions & 0x20) === 0x20);
    if (!userGuild) {
        return res.status(403).json({ error: 'Accès non autorisé à ce serveur' });
    }
    
    next();
}

/**
 * Middleware pour créer la locale
 * Définit la langue de l'utilisateur pour l'interface
 */
function createLocaleMiddleware(client) {
    return (req, res, next) => {
        res.locals.locale = req.user?.locale || 'fr';
        next();
    };
}

class DashboardServer {
    constructor(client) {
        this.client = client;
        
        // Vérifier si le dashboard est activé dans la configuration
        if (!this.client.config.dashboard.enabled) {
            this.client.logs.info('Dashboard désactivé dans la configuration');
            return;
        }

        this.app = express();
        
        // Ajouter le client à l'app pour qu'il soit accessible partout
        this.app.locals.client = this.client;
        
        // Configurer les middlewares, passport et les routes
        this.setupMiddleware();
        this.setupPassport();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Sécurité avec Helmet
        this.app.use(helmet({
            contentSecurityPolicy: false, // Désactivé pour le développement, à activer en production
        }));
        
        // Middleware de base
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // CORS - Autoriser les requêtes depuis le frontend Next.js
        this.app.use(cors({
            origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));

        // Limiter les requêtes pour éviter les abus
        const apiLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limite chaque IP à 100 requêtes par fenêtre
            standardHeaders: true,
            legacyHeaders: false,
            message: { error: 'Trop de requêtes, veuillez réessayer plus tard' }
        });
        this.app.use('/api/', apiLimiter);

        // Session avec stockage MongoDB
        this.app.use(session({
            secret: this.client.config.dashboard.sessionSecret || 'secret',
            store: MongoStore.create({
                mongoUrl: this.client.config.database.mongodb.uri,
                ttl: 24 * 60 * 60 // 1 jour
            }),
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 24 * 60 * 60 * 1000, // 24 heures
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'lax'
            }
        }));

        // Initialisation de Passport pour l'authentification
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        // Middleware pour la locale
        this.app.use(createLocaleMiddleware(this.client));

        // Middleware pour rendre le client accessible dans toutes les routes
        this.app.use((req, res, next) => {
            res.locals.client = this.client;
            res.locals.user = req.user;
            next();
        });
    }

    setupPassport() {
        // Sérialisation et désérialisation de l'utilisateur
        passport.serializeUser((user, done) => done(null, user));
        passport.deserializeUser((obj, done) => done(null, obj));

        // Configuration de la stratégie Discord
        passport.use(new Strategy({
            clientID: this.client.config.app_ip,
            clientSecret: this.client.config.dashboard.clientSecret,
            callbackURL: this.client.config.dashboard.callbackURL,
            scope: this.client.config.dashboard.oauth2.scopes || ['identify', 'guilds'],
            prompt: this.client.config.dashboard.oauth2.prompt || 'consent'
        }, (accessToken, refreshToken, profile, done) => {
            // Stocker le token d'accès pour les futures requêtes
            profile.accessToken = accessToken;
            profile.refreshToken = refreshToken;
            process.nextTick(() => done(null, profile));
        }));
    }

    setupRoutes() {
        // Route principale
        this.app.get('/', async (req, res) => {
            try {
                if (!req.user) {
                    return res.status(200).json({ message: 'Bienvenue sur l\'API du bot' });
                }

                // Récupérer les serveurs où l'utilisateur a les permissions admin
                const guilds = req.user.guilds.filter(g => (g.permissions & 0x20) === 0x20);
                
                // Récupérer les serveurs où le bot est présent
                const botGuilds = this.client.guilds.cache.map(guild => guild.id);

                res.status(200).json({
                    user: {
                        id: req.user.id,
                        username: req.user.username,
                        discriminator: req.user.discriminator,
                        avatar: req.user.avatar
                    },
                    guildsCount: guilds.length,
                    botGuildsCount: botGuilds.length
                });
            } catch (error) {
                console.error('Erreur page d\'accueil:', error);
                res.status(500).json({
                    error: 'Erreur lors du chargement de la page'
                });
            }
        });

        // Routes d'authentification
        this.app.get('/auth/discord', passport.authenticate('discord'));
        
        this.app.get('/auth/discord/callback', 
            passport.authenticate('discord', { 
                failureRedirect: '/' 
            }), 
            (req, res) => {
                // Redirection après authentification réussie
                res.redirect('/dashboard');
            }
        );
        
        this.app.get('/auth/logout', (req, res) => {
            req.logout((err) => {
                if (err) {
                    console.error('Erreur lors de la déconnexion:', err);
                    return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
                }
                res.redirect('/');
            });
        });

        // Configuration CORS spécifique pour l'API
        this.app.use('/api', (req, res, next) => {
            res.header('Access-Control-Allow-Origin', 'http://localhost:3002');
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
        
        // API pour récupérer les serveurs
        this.app.get('/api/guilds', isAuthenticated, (req, res) => {
            try {
                // Récupérer les serveurs où l'utilisateur a les permissions admin
                const guilds = req.user.guilds.filter(g => (g.permissions & 0x20) === 0x20);
                
                // Récupérer les serveurs où le bot est présent
                const botGuilds = this.client.guilds.cache.map(guild => guild.id);
                
                // Ajouter une propriété pour indiquer si le bot est présent
                const enrichedGuilds = guilds.map(guild => ({
                    ...guild,
                    botIn: botGuilds.includes(guild.id)
                }));
                
                res.json(enrichedGuilds);
            } catch (error) {
                console.error('Erreur API guilds:', error);
                res.status(500).json({ error: 'Erreur lors de la récupération des serveurs' });
            }
        });
        
        // API pour récupérer les détails d'un serveur
        this.app.get('/api/guilds/:id', isAuthenticated, hasGuildPermissions, async (req, res) => {
            try {
                const { id } = req.params;
                
                // Vérifier si le bot est dans ce serveur
                const guild = this.client.guilds.cache.get(id);
                if (!guild) {
                    return res.status(404).json({ error: 'Le bot n\'est pas dans ce serveur' });
                }
                
                // Récupérer les informations du serveur
                const guildData = {
                    id: guild.id,
                    name: guild.name,
                    icon: guild.iconURL({ dynamic: true }),
                    memberCount: guild.memberCount,
                    owner: {
                        id: guild.ownerId,
                        tag: (await this.client.users.fetch(guild.ownerId)).tag
                    },
                    channels: guild.channels.cache.map(channel => ({
                        id: channel.id,
                        name: channel.name,
                        type: channel.type
                    })),
                    roles: guild.roles.cache.map(role => ({
                        id: role.id,
                        name: role.name,
                        color: role.hexColor
                    }))
                };
                
                res.json(guildData);
            } catch (error) {
                console.error('Erreur API guild details:', error);
                res.status(500).json({ error: 'Erreur lors de la récupération des détails du serveur' });
            }
        });
        
        // API pour récupérer les commandes
        this.app.get('/api/commands', (req, res) => {
          try {
              const commands = Array.from(this.client.commands.values()).map(cmd => {
                  return {
                      name: cmd.data?.name || "undefined",
                      description: cmd.data?.description || "Pas de description disponible",
                      category: cmd.categoryFromPath || cmd.category || 'Général',
                      usage: cmd.usage || `/${cmd.data?.name || "undefined"}`
                  };
              });
              
              res.json(commands);
          } catch (error) {
              console.error('Erreur API commands:', error);
              res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
          }
      });
        
        // API pour récupérer les statistiques globales
        this.app.get('/api/stats', (req, res) => {
            try {
                // Calculer le temps d'activité en format lisible
                const uptime = this.formatUptime(this.client.uptime);
                
                const stats = {
                    servers: this.client.guilds.cache.size,
                    users: this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
                    commands: this.client.commands.size,
                    uptime: uptime,
                    version: process.env.npm_package_version || '1.0.0',
                    // Vous pouvez ajouter d'autres statistiques ici
                    messages: this.client.messageCount || 0
                };
                
                res.json(stats);
            } catch (error) {
                console.error('Erreur API stats:', error);
                res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
            }
        });

        // API pour récupérer les paramètres d'un serveur
        this.app.get('/api/guilds/:id/settings', isAuthenticated, hasGuildPermissions, async (req, res) => {
            try {
                const { id } = req.params;
                
                // Récupérer les paramètres depuis MongoDB
                const GuildSettings = require('../utils/Schemas/GuildSettings');
                const guildSettings = await GuildSettings.getOrCreate(id);
                
                // Convertir la Map en objet pour la réponse JSON
                const settings = {
                    locale: guildSettings.locale,
                };
                
                // Ajouter les paramètres personnalisés
                guildSettings.settings.forEach((value, key) => {
                    settings[key] = value;
                });
                
                res.json(settings);
            } catch (error) {
                console.error('Erreur API guild settings:', error);
                res.status(500).json({ error: 'Erreur lors de la récupération des paramètres du serveur' });
            }
        });

        // API pour mettre à jour les paramètres d'un serveur
        this.app.post('/api/guilds/:id/settings', isAuthenticated, hasGuildPermissions, async (req, res) => {
            try {
                const { id } = req.params;
                const updatedSettings = req.body;
                
                // Récupérer les paramètres depuis MongoDB
                const GuildSettings = require('../utils/Schemas/GuildSettings');
                const guildSettings = await GuildSettings.getOrCreate(id);
                
                // Mettre à jour la locale si elle est fournie
                if (updatedSettings.locale) {
                    guildSettings.locale = updatedSettings.locale;
                }
                
                // Mettre à jour les paramètres personnalisés
                for (const [key, value] of Object.entries(updatedSettings)) {
                    if (key !== 'locale' && key !== 'guildId' && key !== '_id') {
                        guildSettings.settings.set(key, value);
                    }
                }
                
                // Sauvegarder les modifications
                await guildSettings.save();
                
                res.json({ success: true });
            } catch (error) {
                console.error('Erreur API update guild settings:', error);
                res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres du serveur' });
            }
        });
    }

    /**
     * Formater le temps d'activité en format lisible
     * @param {number} ms - Temps en millisecondes
     * @returns {string} - Temps formaté
     */
    formatUptime(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        
        const parts = [];
        if (days > 0) parts.push(`${days} jour${days > 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
        if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
        if (seconds > 0) parts.push(`${seconds} seconde${seconds > 1 ? 's' : ''}`);
        
        return parts.join(', ');
    }

    setupErrorHandling() {
        // Gestion 404
        this.app.use((req, res) => {
            res.status(404).json({ error: '404: Page non trouvée' });
        });

        // Gestion des erreurs
        this.app.use((err, req, res, next) => {
            console.error('Erreur Dashboard:', err);
            
            // Ne pas exposer les détails de l'erreur en production
            const message = process.env.NODE_ENV === 'production' 
                ? 'Une erreur est survenue' 
                : err.message || 'Une erreur est survenue';
                
            res.status(err.status || 500).json({
                error: message
            });
        });
    }

    start() {
        // Utiliser le port configuré dans main.json ou 3001 par défaut
        const port = this.client.config.dashboard.port || 3001;
        
        this.app.listen(port, () => {
            this.client.logs.success(`Dashboard démarré sur le port ${port}`);
            this.client.logs.info(`URL: http://localhost:${port}`);
        }).on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                this.client.logs.error(`Le port ${port} est déjà utilisé. Veuillez utiliser un autre port.`);
            } else {
                this.client.logs.error(`Erreur lors du démarrage du dashboard: ${error.message}`);
            }
        });
    }
}

module.exports = DashboardServer;
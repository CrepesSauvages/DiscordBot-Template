const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const createLocaleMiddleware = require('./middleware/locale');
const helmet = require('helmet');

class DashboardServer {
    constructor(client) {
        this.client = client;
        
        if (!this.client.config.dashboard.enabled) {
            this.client.logs.info('Dashboard désactivé');
            return;
        }

        this.app = express();
        
        // Ajouter le client à l'app pour qu'il soit accessible partout
        this.app.locals.client = this.client;
        
        this.setupMiddleware();
        this.setupPassport();
        this.setupRoutes();
        this.setupErrorHandling();
        
        // Démarrer le serveur automatiquement
        this.start();
    }

    setupMiddleware() {
        // Sécurité
        this.app.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false
        }));

        // Configuration des vues
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.use(express.static(path.join(__dirname, 'public')));

        // Parsers
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser());

        // CORS
        this.app.use(cors({
            origin: ['http://localhost:3000'],
            credentials: true
        }));

        // Session
        this.app.use(session({
            secret: this.client.config.dashboard.sessionSecret,
            store: MongoStore.create({
                mongoUrl: this.client.config.database.mongodb.uri
            }),
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 24 * 60 * 60 * 1000, // 24 heures
                secure: process.env.NODE_ENV === 'production'
            }
        }));

        // Passport
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        // Locale Middleware
        this.app.use(createLocaleMiddleware(this.client));

        // Middleware pour rendre le client accessible dans toutes les routes
        this.app.use((req, res, next) => {
            res.locals.client = this.client;
            res.locals.user = req.user;
            next();
        });
    }

    setupPassport() {
        passport.serializeUser((user, done) => done(null, user));
        passport.deserializeUser((obj, done) => done(null, obj));

        passport.use(new Strategy({
            clientID: this.client.config.app_ip,
            clientSecret: this.client.config.dashboard.clientSecret,
            callbackURL: this.client.config.dashboard.callbackURL,
            scope: ['identify', 'guilds'],
            prompt: 'consent'
        }, (accessToken, refreshToken, profile, done) => {
            // Stocker le token d'accès pour les futures requêtes
            profile.accessToken = accessToken;
            process.nextTick(() => done(null, profile));
        }));
    }

    setupRoutes() {
        // Route principale
        this.app.get('/', async (req, res) => {
            try {
                if (!req.user) {
                    return res.render('login');
                }

                // Récupérer les serveurs où l'utilisateur a les permissions admin
                const guilds = req.user.guilds.filter(g => (g.permissions & 0x20) === 0x20);
                
                // Récupérer les serveurs où le bot est présent
                const botGuilds = this.client.guilds.cache.map(guild => guild.id);

                res.render('dashboard', {
                    user: req.user,
                    guilds: guilds,
                    botGuilds: botGuilds
                });
            } catch (error) {
                console.error('Erreur page d\'accueil:', error);
                res.status(500).render('error', {
                    error: 'Erreur lors du chargement de la page',
                    user: req.user
                });
            }
        });

        // Routes d'authentification
        const authRoutes = require('./routes/auth');
        this.app.use('/auth', authRoutes);

        // Routes protégées
        const guildRoutes = require('./routes/guild');
        const commandsRoutes = require('./routes/commands');
        const settingsRoutes = require('./routes/settings');

        // Middleware d'authentification pour les routes protégées
        const { isAuthenticated } = require('./middleware/auth');
        this.app.use('/dashboard', isAuthenticated);
        this.app.use('/guild', isAuthenticated);

        // Enregistrement des routes
        this.app.use('/', guildRoutes);
        this.app.use('/', commandsRoutes);
        this.app.use('/', settingsRoutes);
    }

    setupErrorHandling() {
        // Gestion 404
        this.app.use((req, res) => {
            res.status(404).render('error', {
                error: '404: Page non trouvée',
                user: req.user
            });
        });

        // Gestion des erreurs
        this.app.use((err, req, res, next) => {
            console.error('Erreur Dashboard:', err);
            res.status(err.status || 500).render('error', {
                error: err.message || 'Une erreur est survenue',
                user: req.user
            });
        });
    }

    start() {
        const port = this.client.config.dashboard.port || 3000;
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

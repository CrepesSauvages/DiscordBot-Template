const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const localeMiddleware = require('./middleware/locale');

class DashboardServer {
    constructor(client) {
        this.client = client;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser());
        this.app.use(cors());
        
        // Configuration de la session avec MongoDB
        this.app.use(session({
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            store: MongoStore.create({
                mongoUrl: process.env.MONGODB_URI,
                collectionName: 'sessions',
                ttl: 60 * 60 * 24, // 24 heures
                autoRemove: 'native',
                touchAfter: 24 * 3600 // 24 heures
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24, // 24 heures
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            }
        }));
        
        this.app.use(passport.initialize());
        this.app.use(passport.session());
        
        // Middleware de traduction
        this.app.use(localeMiddleware);
        
        // Rendre le client Discord disponible dans les routes
        this.app.use((req, res, next) => {
            req.app.client = this.client;
            res.locals.user = req.user;
            res.locals.client = this.client;
            next();
        });
    }

    setupRoutes() {
        const authRoutes = require('./routes/auth');
        const apiRoutes = require('./routes/api');
        const commandsRoutes = require('./routes/commands');
        const settingsRoutes = require('./routes/settings');

        // Middleware pour vérifier l'authentification
        const isAuthenticated = (req, res, next) => {
            if (req.isAuthenticated()) return next();
            res.redirect('/auth/login');
        };

        this.app.use('/auth', authRoutes);
        this.app.use('/api', isAuthenticated, apiRoutes);
        this.app.use('/', isAuthenticated, commandsRoutes);
        this.app.use('/', isAuthenticated, settingsRoutes);
        
        // Route par défaut
        this.app.get('/', async (req, res) => {
            try {
                const botGuilds = this.client.guilds.cache.map(guild => guild.id);
                res.render('index', { 
                    user: req.user,
                    guilds: req.user ? req.user.guilds.filter(g => (g.permissions & 0x20) === 0x20) : [],
                    botGuilds: botGuilds,
                    clientId: this.client.user.id
                });
            } catch (error) {
                console.error('Erreur:', error);
                res.status(500).render('error', { 
                    error: 'Une erreur est survenue',
                    user: req.user
                });
            }
        });
    }

    setupErrorHandling() {
        // Route pour la page d'erreur 404
        this.app.use((req, res) => {
            res.status(404).render('error', { 
                error: res.locals.translate('common.error.notFound'),
                user: req.user
            });
        });

        // Gestion des erreurs générales
        this.app.use((error, req, res, next) => {
            console.error('Erreur serveur:', error);
            res.status(500).render('error', {
                error: res.locals.translate('common.error.server'),
                user: req.user
            });
        });
    }

    start() {
        const port = process.env.DASHBOARD_PORT || 3000;
        this.app.listen(port, () => {
            this.client.logs.info(`Dashboard démarré sur le port ${port}`);
        });
    }
}

module.exports = DashboardServer;

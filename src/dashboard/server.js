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

        // Session
        this.app.use(session({
            secret: this.client.config.dashboard.sessionSecret,
            store: MongoStore.create({
                mongoUrl: this.client.config.database.mongodb.uri
            }),
            resave: false,
            saveUninitialized: false,
            cookie: this.client.config.dashboard.session.cookie
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
            scope: this.client.config.dashboard.oauth2.scopes,
            prompt: this.client.config.dashboard.oauth2.prompt
        }, (accessToken, refreshToken, profile, done) => {
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

                res.render('index', {
                    user: req.user,
                    guilds: guilds,
                    botGuilds: botGuilds,
                    clientId: this.client.user.id
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
        this.app.get('/auth/login', passport.authenticate('discord'));
        this.app.get('/auth/discord/callback', passport.authenticate('discord', {
            failureRedirect: '/'
        }), (req, res) => res.redirect('/'));
        this.app.get('/auth/logout', (req, res) => {
            req.logout(() => res.redirect('/'));
        });

        // Routes des serveurs
        const guildRoutes = require('./routes/guild');
        const commandsRoutes = require('./routes/commands');
        const settingsRoutes = require('./routes/settings');

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
            this.client.logs.error(`Erreur Dashboard: ${err.stack}`);
            res.status(err.status || 500).render('error', {
                error: err.message,
                user: req.user
            });
        });
    }

    start() {
        const port = this.client.config.dashboard.port;
        this.app.listen(port, () => {
            this.client.logs.success(`Dashboard démarré sur le port ${port}`);
            this.client.logs.info(`URL: http://localhost:${port}`);
        });
    }
}

module.exports = DashboardServer;

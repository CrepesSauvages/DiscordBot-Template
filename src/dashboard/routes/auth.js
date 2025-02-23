const router = require('express').Router();
const passport = require('passport');

// Page de connexion
router.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/dashboard');
    }
    res.render('login', { 
        user: req.user,
        error: req.query.error 
    });
});

// Démarrer l'authentification Discord
router.get('/discord', passport.authenticate('discord', {
    scope: ['identify', 'guilds']
}));

// Callback Discord
router.get('/discord/callback', 
    passport.authenticate('discord', {
        failureRedirect: '/auth/login?error=auth_failed',
        failureMessage: true
    }), 
    (req, res) => {
        // Vérifier si l'utilisateur a bien les guildes dans son profil
        if (!req.user || !req.user.guilds) {
            req.logout((err) => {
                if (err) console.error('Erreur lors de la déconnexion:', err);
                res.redirect('/auth/login?error=missing_guilds');
            });
            return;
        }
        
        // Redirection réussie
        const redirectTo = req.session.returnTo || '/dashboard';
        delete req.session.returnTo;
        res.redirect(redirectTo);
    }
);

// Déconnexion
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur lors de la destruction de la session:', err);
        }
        res.redirect('/');
    });
});

module.exports = router;
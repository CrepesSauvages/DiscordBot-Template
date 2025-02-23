const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
};

const hasGuildPermission = async (req, res, next) => {
    try {
        // Vérifier si l'utilisateur est connecté
        if (!req.isAuthenticated()) {
            return res.redirect('/auth/login');
        }

        // Vérifier si l'utilisateur et ses guildes sont disponibles
        if (!req.user) {
            console.error('User not found in request');
            return res.redirect('/auth/login');
        }

        // Si les guildes ne sont pas disponibles, rediriger vers la connexion
        if (!req.user.guilds) {
            console.error('Guilds not found in user profile');
            req.logout((err) => {
                if (err) console.error('Erreur lors de la déconnexion:', err);
                res.redirect('/auth/login');
            });
            return;
        }

        const guildId = req.params.guildId;
        
        // Vérifier les permissions de l'utilisateur (MANAGE_GUILD = 0x20)
        const guild = req.user.guilds.find(g => g.id === guildId && (g.permissions & 0x20) === 0x20);
        
        if (!guild) {
            return res.status(403).render('error', { 
                error: 'Vous n\'avez pas les permissions nécessaires pour gérer ce serveur',
                user: req.user
            });
        }

        // Vérifier si le bot est dans le serveur
        try {
            await req.app.locals.client.guilds.fetch(guildId);
        } catch (error) {
            return res.status(404).render('error', {
                error: 'Le bot n\'est pas présent dans ce serveur',
                user: req.user
            });
        }

        // Ajouter le guild aux données locales pour la vue
        res.locals.guild = guild;
        next();
    } catch (error) {
        console.error('Erreur dans le middleware hasGuildPermission:', error);
        res.status(500).render('error', {
            error: 'Une erreur est survenue lors de la vérification des permissions',
            user: req.user
        });
    }
};

module.exports = {
    isAuthenticated,
    hasGuildPermission
};
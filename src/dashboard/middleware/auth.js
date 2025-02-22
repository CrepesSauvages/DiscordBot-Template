const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
};

const hasGuildPermission = (req, res, next) => {
    // Vérifier d'abord si l'utilisateur est connecté
    if (!req.isAuthenticated()) {
        return res.redirect('/auth/login');
    }

    const guildId = req.params.guildId;
    const userGuilds = req.user.guilds;
    
    if (!userGuilds) {
        return res.status(401).render('error', {
            error: 'Session expirée, veuillez vous reconnecter',
            user: req.user
        });
    }
    
    const guild = userGuilds.find(g => g.id === guildId && (g.permissions & 0x20) === 0x20);
    
    if (guild) {
        // Ajouter le guild aux données locales pour la vue
        res.locals.guild = guild;
        return next();
    }

    res.status(403).render('error', { 
        error: 'Permissions insuffisantes pour ce serveur',
        user: req.user
    });
};

module.exports = {
    isAuthenticated,
    hasGuildPermission
}; 
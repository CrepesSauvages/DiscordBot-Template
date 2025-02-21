const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
};

const hasGuildPermission = (req, res, next) => {
    const guildId = req.params.guildId;
    const userGuilds = req.user.guilds;
    
    const guild = userGuilds.find(g => g.id === guildId && (g.permissions & 0x20) === 0x20);
    
    if (guild) {
        return next();
    }
    res.status(403).render('error', { 
        error: 'Permissions insuffisantes pour ce serveur'
    });
};

module.exports = { isAuthenticated, hasGuildPermission }; 
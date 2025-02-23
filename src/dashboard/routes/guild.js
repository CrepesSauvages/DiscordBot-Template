const router = require('express').Router();
const { hasGuildPermission } = require('../middleware/auth');
const GuildSettings = require('../../utils/Schemas/GuildSettings');

// Route principale du serveur
router.get('/guild/:guildId', hasGuildPermission, async (req, res) => {
    try {
        const guild = await req.app.client.guilds.fetch(req.params.guildId);
        const guildSettings = await GuildSettings.getOrCreate(req.params.guildId);

        res.render('guild/index', {
            guild,
            settings: guildSettings,
            user: req.user
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).render('error', { 
            error: 'Erreur lors du chargement du serveur',
            user: req.user 
        });
    }
});

module.exports = router; 
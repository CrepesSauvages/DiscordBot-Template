const router = require('express').Router();
const { hasGuildPermission } = require('../middleware/auth');
const GuildSettings = require('../../utils/Schemas/GuildSettings');

// Route principale du serveur
router.get('/guild/:guildId', hasGuildPermission, async (req, res) => {
    try {
        // Récupérer la guilde depuis le client Discord
        const guild = await req.app.locals.client.guilds.fetch(req.params.guildId);
        
        // Récupérer ou créer les paramètres de la guilde
        const guildSettings = await GuildSettings.getOrCreate(req.params.guildId);

        res.render('guild/index', {
            guild,
            settings: guildSettings,
            user: req.user
        });
    } catch (error) {
        console.error('Erreur lors du chargement du serveur:', error);
        res.status(500).render('error', { 
            error: 'Une erreur est survenue lors du chargement du serveur',
            user: req.user 
        });
    }
});

module.exports = router;
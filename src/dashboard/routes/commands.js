const router = require('express').Router();
const { hasGuildPermission } = require('../middleware/auth');

router.get('/guild/:guildId/commands', hasGuildPermission, async (req, res) => {
    try {
        const guild = await req.app.client.guilds.fetch(req.params.guildId);
        const commands = Array.from(req.app.client.commands.values()).map(cmd => ({
            name: cmd.data.name,
            description: cmd.data.description,
            enabled: true, // À remplacer par la vraie valeur depuis la DB
            permissions: cmd.userPerms || [],
            cooldown: cmd.cooldown || 0
        }));

        res.render('commands', { 
            guild,
            commands,
            user: req.user
        });
    } catch (error) {
        res.status(500).render('error', { error: error.message });
    }
});

router.patch('/api/guild/:guildId/commands/:commandName', hasGuildPermission, async (req, res) => {
    try {
        const { guildId, commandName } = req.params;
        const { enabled } = req.body;
        
        // Mettre à jour dans la base de données
        // await GuildSettings.updateCommand(guildId, commandName, { enabled });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/api/guild/:guildId/commands/:commandName/settings', hasGuildPermission, async (req, res) => {
    try {
        const { guildId, commandName } = req.params;
        // Récupérer les paramètres depuis la base de données
        // const settings = await GuildSettings.getCommandSettings(guildId, commandName);
        
        res.json({
            cooldown: 0,
            permissions: []
            // ... autres paramètres
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 
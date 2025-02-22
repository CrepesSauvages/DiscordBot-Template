const router = require('express').Router();
const { isAuthenticated, hasGuildPermission } = require('../middleware/auth');

router.get('/guild/:guildId/commands', isAuthenticated, hasGuildPermission, async (req, res) => {
    try {
        const guild = await res.locals.client.guilds.fetch(req.params.guildId);
        
        const commands = Array.from(res.locals.client.commands.values()).map(cmd => ({
            name: cmd.data.name,
            description: cmd.data.description,
            category: cmd.category || 'Général',
            permissions: cmd.userPerms || [],
            enabled: true // Vous pouvez ajouter une logique pour vérifier si la commande est activée
        }));

        const commandsByCategory = commands.reduce((acc, cmd) => {
            if (!acc[cmd.category]) {
                acc[cmd.category] = [];
            }
            acc[cmd.category].push(cmd);
            return acc;
        }, {});

        res.render('commands', { 
            guild,
            commandsByCategory,
            user: req.user,
            active: 'commands'
        });
    } catch (error) {
        console.error('Erreur route commandes:', error);
        res.status(500).render('error', { 
            error: 'Erreur lors du chargement des commandes',
            user: req.user 
        });
    }
});

router.patch('/api/guild/:guildId/commands/:commandName', isAuthenticated, hasGuildPermission, async (req, res) => {
    try {
        const { guildId, commandName } = req.params;
        const { enabled } = req.body;

        // Ici, ajoutez la logique pour activer/désactiver la commande
        // Par exemple, sauvegarder l'état dans la base de données

        res.json({
            success: true,
            message: `Commande ${commandName} ${enabled ? 'activée' : 'désactivée'}`
        });
    } catch (error) {
        console.error('Erreur modification commande:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la modification de la commande'
        });
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
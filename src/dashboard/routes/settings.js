const router = require('express').Router();
const { isAuthenticated, hasGuildPermission } = require('../middleware/auth');
const GuildSettings = require('../../utils/Schemas/GuildSettings');

// Route pour obtenir la page des paramètres
router.get('/guild/:guildId/settings', isAuthenticated, hasGuildPermission, async (req, res) => {
    try {
        const guild = await res.locals.client.guilds.fetch(req.params.guildId);
        
        // Récupération des canaux
        const channels = guild.channels.cache
            .filter(c => c.type === 0)
            .map(c => ({
                id: c.id,
                name: c.name
            }));

        // Récupération des rôles
        const roles = guild.roles.cache
            .filter(r => r.name !== '@everyone')
            .map(r => ({
                id: r.id,
                name: r.name
            }));

        // Récupération des paramètres depuis MongoDB
        const guildSettings = await GuildSettings.getOrCreate(guild.id);

        res.render('settings', {
            guild,
            channels,
            roles,
            settings: {
                language: guildSettings.locale,
                ...guildSettings.settings
            },
            user: req.user
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).render('error', { 
            error: 'Erreur lors du chargement des paramètres',
            user: req.user 
        });
    }
});

// Route pour sauvegarder les paramètres
router.post('/api/guild/:guildId/settings', isAuthenticated, hasGuildPermission, async (req, res) => {
    try {
        const guildId = req.params.guildId;
        const settings = req.body;
        
        // Récupérer ou créer les paramètres du serveur
        const guildSettings = await GuildSettings.getOrCreate(guildId);
        
        // Mettre à jour la langue si elle est fournie
        if (settings.language) {
            guildSettings.locale = settings.language;
            
            // Vérifier si le client et locales existent avant d'appeler setGuildLocale
            if (res.locals.client && res.locals.client.locales) {
                await res.locals.client.locales.setGuildLocale(guildId, settings.language);
            }
        }
        
        // Mettre à jour les autres paramètres
        for (const [key, value] of Object.entries(settings)) {
            if (key !== 'language') {
                // Utiliser set() de Map pour les paramètres
                if (!guildSettings.settings) {
                    guildSettings.settings = new Map();
                }
                guildSettings.settings.set(key, value);
            }
        }

        // Marquer settings comme modifié pour MongoDB
        guildSettings.markModified('settings');
        
        // Sauvegarder les modifications
        await guildSettings.save();

        res.json({
            success: true,
            message: 'Paramètres sauvegardés avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la sauvegarde des paramètres:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la sauvegarde des paramètres'
        });
    }
});

// Route pour mettre à jour un paramètre individuel
router.patch('/api/guild/:guildId/settings/:setting', hasGuildPermission, async (req, res) => {
    try {
        const { guildId, setting } = req.params;
        const { value } = req.body;

        const guildSettings = await GuildSettings.getOrCreate(guildId);

        if (setting === 'language') {
            guildSettings.locale = value;
            // Utiliser res.locals.client au lieu de req.app.client
            await res.locals.client.locales.setGuildLocale(guildId, value);
        } else {
            if (!guildSettings.settings) {
                guildSettings.settings = new Map();
            }
            guildSettings.settings.set(setting, value);
            guildSettings.markModified('settings');
        }

        await guildSettings.save();

        res.json({ 
            success: true,
            message: `Paramètre ${setting} mis à jour avec succès`
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la mise à jour du paramètre',
            details: error.message 
        });
    }
});

// Route pour obtenir les paramètres d'une commande
router.get('/api/guild/:guildId/commands/:commandName/settings', hasGuildPermission, async (req, res) => {
    try {
        const { guildId, commandName } = req.params;
        const guildSettings = await GuildSettings.getOrCreate(guildId);
        
        const commandSettings = guildSettings.settings.commandSettings.get(commandName) || {
            enabled: true,
            cooldown: 0,
            permissions: []
        };

        res.json(commandSettings);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des paramètres de la commande',
            details: error.message 
        });
    }
});

// Route pour mettre à jour les paramètres d'une commande
router.put('/api/guild/:guildId/commands/:commandName/settings', hasGuildPermission, async (req, res) => {
    try {
        const { guildId, commandName } = req.params;
        const settings = req.body;

        await GuildSettings.updateCommandSettings(guildId, commandName, settings);

        res.json({ 
            success: true,
            message: 'Paramètres de la commande mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la mise à jour des paramètres de la commande',
            details: error.message 
        });
    }
});

module.exports = router; 
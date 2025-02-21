const GuildSettings = require('../../utils/Schemas/GuildSettings');

async function localeMiddleware(req, res, next) {
    try {
        // Ajouter la fonction de traduction à res.locals
        res.locals.translate = (key, replacements = {}) => {
            const locale = req.locale || 'fr';
            return req.app.client.locales.translate(key, locale, replacements);
        };

        // Si on est dans un contexte de serveur, charger sa langue
        if (req.params.guildId) {
            const guildSettings = await GuildSettings.getOrCreate(req.params.guildId);
            req.locale = guildSettings.locale;
        } else {
            // Sinon utiliser la langue de l'utilisateur ou la langue par défaut
            req.locale = req.user?.locale || 'fr';
        }

        // Ajouter les traductions complètes pour le JavaScript client
        res.locals.translations = req.app.client.locales.locales.get(req.locale);

        next();
    } catch (error) {
        console.error('Erreur middleware locale:', error);
        next(error);
    }
}

module.exports = localeMiddleware; 
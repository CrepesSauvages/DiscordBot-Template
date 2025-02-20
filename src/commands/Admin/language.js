const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    userPerms: ['ManageGuild'],
    data: new SlashCommandBuilder()
        .setName('language')
        .setDescription('Définir la langue du serveur')
        .addStringOption(option =>
            option.setName('locale')
                .setDescription('Choisir la langue')
                .setRequired(true)
                .addChoices(
                    { name: 'Français', value: 'fr' },
                    { name: 'English', value: 'en' },
                    { name: 'Español', value: 'es' }
                )),

    async execute(interaction, client) {
        const locale = interaction.options.getString('locale');
        
        try {
            // Vérifier si la langue est disponible
            if (!client.locales.locales.has(locale)) {
                return await interaction.reply({
                    content: "Cette langue n'est pas disponible.",
                    ephemeral: true
                });
            }

            await client.locales.setGuildLocale(interaction.guildId, locale);
            
            // Obtenir le message dans la nouvelle langue
            const response = client.locales.translate('commands.language.success', locale, {
                language: locale.toUpperCase()
            });
            
            await interaction.reply({
                content: response,
                ephemeral: true
            });
        } catch (error) {
            client.logs.error(`Erreur language command: ${error.message}`);
            await interaction.reply({
                content: "Une erreur est survenue lors du changement de langue.",
                ephemeral: true
            });
        }
    }
}; 
const { SlashCommandBuilder } = require('discord.js');
const GuildSettings = require('../../utils/Schemas/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogs')
        .setDescription('Définit le canal pour les logs')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Le canal où seront envoyés les logs')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
            return interaction.reply({ 
                content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                ephemeral: true 
            });
        }

        const channel = interaction.options.getChannel('channel');
        
        try {
            const guildSettings = await GuildSettings.getOrCreate(interaction.guild.id);
            guildSettings.settings.set('logChannel', channel.id);
            await guildSettings.save();

            await interaction.reply({
                content: `✅ Le canal de logs a été défini sur ${channel}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erreur lors de la définition du canal de logs:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la configuration du canal de logs.',
                ephemeral: true
            });
        }
    }
};
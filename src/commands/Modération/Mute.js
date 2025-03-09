const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    userPerms: ['ModerateMembers'],
    clientPerms: ['ModerateMembers'],
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute un utilisateur')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('L\'utilisateur à mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Raison du mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Durée du mute (ex: 1h, 1d, 7d)')
                .setRequired(false)),
    
    async execute(interaction, client) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const duration = interaction.options.getString('duration');

        try {
            await client.moderationService.muteUser(interaction, user, reason, duration);
            
            const durationText = duration ? ` pendant ${duration}` : ' de façon permanente';
            await interaction.reply({
                content: `${user.tag} a été mute${durationText}`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: `Erreur lors du mute: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    userPerms: ['ModerateMembers'],
    clientPerms: ['ModerateMembers'],
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute un utilisateur')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('L\'utilisateur à unmute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Raison du unmute')
                .setRequired(true)),
    
    async execute(interaction, client) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        try {
            await client.moderationService.unmuteUser(interaction, user, reason);
            
            await interaction.reply({
                content: `${user.tag} a été unmute`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: `Erreur lors du unmute: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
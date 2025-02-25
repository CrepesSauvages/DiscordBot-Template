const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const MuteModel = require('../../utils/Schemas/Moderation/Mute.js');

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
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        
        // Mettre à jour le mute dans la base de données
        const mute = await MuteModel.findOneAndUpdate(
            { userId: user.id, guildId: interaction.guild.id, active: true },
            { active: false },
            { new: true }
        );
        
        if (!mute) {
            return interaction.reply({
                content: 'Cet utilisateur n\'est pas mute.',
                ephemeral: true
            });
        }
        
        // Retirer le timeout Discord
        const member = await interaction.guild.members.fetch(user.id);
        await member.timeout(null, reason);
        
        // Log et réponse
        await interaction.client.logManager.sendLogEmbed(interaction.guild.id, {
            color: '#00FF00',
            title: '🔊 Utilisateur Unmute',
            description: `L'utilisateur ${user.tag} a été unmute.`,
            fields: [
                { name: 'Utilisateur', value: `${user.tag} (${user.id})` },
                { name: 'Modérateur', value: interaction.user.toString() },
                { name: 'Raison', value: reason }
            ]
        });
        
        await interaction.reply(`${user.toString()} a été unmute`);
    }
};
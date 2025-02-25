const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MuteModel = require('../../utils/Schemas/Moderation/Mute.js');

// Fonction pour formater la durée en format lisible
function formatDuration(ms) {
    if (!ms) return 'Permanent';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
}

module.exports = {
    userPerms: ['ModerateMembers'],
    clientPerms: ['ModerateMembers'],
    data: new SlashCommandBuilder()
        .setName('mutehistory')
        .setDescription('Voir l\'historique des mutes d\'un utilisateur')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('L\'utilisateur à vérifier')
                .setRequired(true)),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        
        const mutes = await MuteModel.find({
            userId: user.id,
            guildId: interaction.guild.id
        }).sort({ timestamp: -1 });
        
        if (mutes.length === 0) {
            return interaction.reply({
                content: 'Cet utilisateur n\'a jamais été mute.',
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle(`Historique des mutes de ${user.tag}`)
            .setDescription(`Total: ${mutes.length} mute(s)`)
            .setTimestamp();
        
        mutes.forEach((mute, index) => {
            if (index < 25) { // Limite de 25 champs
                embed.addFields({
                    name: `Mute ${index + 1}`,
                    value: `**Raison:** ${mute.reason}\n**Date:** <t:${Math.floor(mute.timestamp.getTime() / 1000)}:R>\n**Durée:** ${formatDuration(mute.duration)}\n**Modérateur:** <@${mute.moderatorId}>\n**Status:** ${mute.active ? (mute.expiresAt && mute.expiresAt < new Date() ? '⏰ Expiré' : '✅ Actif') : '❌ Révoqué'}`
                });
            }
        });
        
        await interaction.reply({ embeds: [embed] });
    }
};
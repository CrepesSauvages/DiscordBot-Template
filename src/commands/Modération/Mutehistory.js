const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ModCase = require('../../utils/Schemas/Moderation/ModCase.js');

// Fonction pour formater la durée en format lisible
function formatDuration(ms, translate) {
    if (!ms) return translate('common.permanent');
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return translate('common.time.days', { count: days });
    if (hours > 0) return translate('common.time.hours', { count: hours });
    if (minutes > 0) return translate('common.time.minutes', { count: minutes });
    return translate('common.time.seconds', { count: seconds });
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
    
    async execute(interaction, client) {
        const locale = await client.locales.getGuildLocale(interaction.guildId);
        const translate = (key, vars = {}) => client.locales.translate(key, locale, vars);
        
        const user = interaction.options.getUser('user');
        
        const modCases = await ModCase.find({
            userId: user.id,
            guildId: interaction.guild.id,
            'sanction.type': 'MUTE'
        });
        
        if (!modCases.length) {
            return interaction.reply({
                content: translate('commands.mutehistory.no_mutes'),
                ephemeral: true
            });
        }
        
        const muteHistory = modCases.flatMap(mc => 
            mc.sanction
                .filter(s => s.type === 'MUTE')
                .map(s => ({
                    moderator: s.moderatorId,
                    reason: s.reason,
                    date: s.createdAt,
                    duration: s.duration,
                    active: s.active
                }))
        ).sort((a, b) => b.date - a.date);
        
        const embed = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle(translate('commands.mutehistory.title', { user: user.tag }))
            .setDescription(translate('commands.mutehistory.total', { count: muteHistory.length }))
            .setTimestamp();
            
        for (const mute of muteHistory.slice(0, 25)) {
            embed.addFields({
                name: `${new Date(mute.date).toLocaleDateString()}`,
                value: `**Modérateur:** <@${mute.moderator}>\n**Raison:** ${mute.reason}\n**Durée:** ${mute.duration ? formatDuration(mute.duration, translate) : 'Permanent'}\n**Statut:** ${mute.active ? 'Actif' : 'Inactif'}`,
                inline: false
            });
        }
        
        await interaction.reply({ embeds: [embed] });
    }
};
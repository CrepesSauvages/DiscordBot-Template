const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MuteModel = require('../../utils/Schemas/Moderation/Mute.js');

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
        
        const mutes = await MuteModel.find({
            userId: user.id,
            guildId: interaction.guild.id
        }).sort({ timestamp: -1 });
        
        if (mutes.length === 0) {
            return interaction.reply({
                content: translate('commands.mutehistory.no_mutes'),
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle(translate('commands.mutehistory.title', { user: user.tag }))
            .setDescription(translate('commands.mutehistory.total', { count: mutes.length }))
            .setTimestamp();
        
        mutes.forEach((mute, index) => {
            if (index < 25) { // Limite de 25 champs
                const status = mute.active 
                    ? (mute.expiresAt && mute.expiresAt < new Date() 
                        ? translate('commands.mutehistory.status.expired')
                        : translate('commands.mutehistory.status.active'))
                    : translate('commands.mutehistory.status.revoked');

                embed.addFields({
                    name: translate('commands.mutehistory.mute_number', { number: index + 1 }),
                    value: translate('commands.mutehistory.mute_details', {
                        reason: mute.reason,
                        date: `<t:${Math.floor(mute.timestamp.getTime() / 1000)}:R>`,
                        duration: formatDuration(mute.duration, translate),
                        moderator: `<@${mute.moderatorId}>`,
                        status: status
                    })
                });
            }
        });
        
        await interaction.reply({ embeds: [embed] });
    }
};
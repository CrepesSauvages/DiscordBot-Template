const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const MuteModel = require('../../utils/Schemas/Moderation/Mute.js');

function parseDuration(duration) {
    if (!duration) return null;
    const match = duration.match(/^(\d+)([dhm])$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 'd': return value * 24 * 60 * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'm': return value * 60 * 1000;
        default: return null;
    }
}

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
                .setDescription('Durée du mute (ex: 1h, 1d, 7d) - laissez vide pour permanent')
                .setRequired(false)),
    
    async execute(interaction, client) {
        const locale = await client.locales.getGuildLocale(interaction.guildId);
        const translate = (key, vars = {}) => client.locales.translate(key, locale, vars);
        
        const user = interaction.options.getUser('user');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason');
        
        // Convertir la durée en ms
        const durationMs = duration ? parseDuration(duration) : null;
        const expiresAt = durationMs ? new Date(Date.now() + durationMs) : null;
        
        // Créer le mute dans la base de données
        const mute = new MuteModel({
            userId: user.id,
            guildId: interaction.guild.id,
            moderatorId: interaction.user.id,
            reason: reason,
            duration: durationMs,
            expiresAt: expiresAt
        });
        
        await mute.save();
        
        // Appliquer le timeout Discord
        const member = await interaction.guild.members.fetch(user.id);
        if (durationMs && durationMs <= 2419200000) { // Max 28 jours pour Discord
            await member.timeout(durationMs, reason);
        }
        
        // Log et réponse
        await interaction.client.logManager.sendLogEmbed(interaction.guild.id, {
            color: '#FF4500',
            title: translate('commands.mute.log_title'),
            description: translate('commands.mute.log_description', {
                user: user.tag,
                moderator: interaction.user.tag
            }),
            fields: [
                { 
                    name: translate('common.user'),
                    value: `${user.tag} (${user.id})`
                },
                { 
                    name: translate('common.moderator'),
                    value: interaction.user.toString()
                },
                { 
                    name: translate('common.duration'),
                    value: duration || translate('common.permanent')
                },
                { 
                    name: translate('common.reason'),
                    value: reason
                }
            ]
        });
        
        const replyEmbed = new EmbedBuilder()
            .setColor('#FF4500')
            .setDescription(
                translate(
                    duration ? 'commands.mute.success_temp' : 'commands.mute.success_perm',
                    {
                        user: user.toString(),
                        duration: duration
                    }
                )
            )
            .setTimestamp();
            
        await interaction.reply({ embeds: [replyEmbed] });
    }
};
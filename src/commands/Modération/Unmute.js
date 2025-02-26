const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
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
    
    async execute(interaction, client) {
        const locale = await client.locales.getGuildLocale(interaction.guildId);
        const translate = (key, vars = {}) => client.locales.translate(key, locale, vars);
        
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
                content: translate('commands.unmute.not_muted'),
                ephemeral: true
            });
        }
        
        // Retirer le timeout Discord
        const member = await interaction.guild.members.fetch(user.id);
        await member.timeout(null, reason);
        
        // Log et réponse
        await interaction.client.logManager.sendLogEmbed(interaction.guild.id, {
            color: '#00FF00',
            title: translate('commands.unmute.log_title'),
            description: translate('commands.unmute.log_description', {
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
                    name: translate('common.reason'),
                    value: reason
                }
            ]
        });
        
        const replyEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(translate('commands.unmute.success', { user: user.toString() }))
            .setTimestamp();
            
        await interaction.reply({ embeds: [replyEmbed] });
    }
};
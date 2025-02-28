const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    cooldown: 3,
    userPerms: ['ModerateMembers'],
    data: new SlashCommandBuilder()
        .setName('modstats')
        .setDescription('Afficher les statistiques de modération')
        .addStringOption(option =>
            option.setName('period')
                .setDescription('Période des statistiques')
                .setRequired(false)
                .addChoices(
                    { name: '24 heures', value: '24h' },
                    { name: '7 jours', value: '7d' },
                    { name: '30 jours', value: '30d' },
                    { name: 'Tout', value: 'all' }
                )),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const stats = await client.moderationService.getModStats(interaction.guild.id);
            if (!stats) {
                return interaction.editReply('Aucune statistique disponible.');
            }

            // Filtrer les actions récentes selon la période sélectionnée
            const period = interaction.options.getString('period') || '30d';
            const now = new Date();
            let timeLimit;
            
            switch(period) {
                case '24h':
                    timeLimit = new Date(now - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    timeLimit = new Date(now - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    timeLimit = new Date(now - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    timeLimit = new Date(0);
            }

            const filteredActions = stats.recentActions.filter(action => 
                action.timestamp > timeLimit
            );

            // Créer l'embed principal avec les statistiques globales
            const mainEmbed = new EmbedBuilder()
                .setColor('#7289DA')
                .setTitle('📊 Statistiques de Modération')
                .setDescription(`Statistiques ${period === 'all' ? 'globales' : `des derniers ${period}`}`)
                .addFields(
                    { 
                        name: '📝 Sanctions Totales', 
                        value: `${stats.totalSanctions}`, 
                        inline: true 
                    },
                    { 
                        name: '⚠️ Sanctions Actives', 
                        value: `${stats.activeSanctions}`, 
                        inline: true 
                    },
                    { 
                        name: '👥 Utilisateurs Sanctionnés', 
                        value: `${stats.totalCases}`, 
                        inline: true 
                    }
                )
                .setTimestamp();

            // Ajouter les statistiques par type
            const typeStats = Object.entries(stats.byType)
                .filter(([, count]) => count > 0)
                .map(([type, count]) => `${getEmojiForType(type)} ${type}: ${count}`)
                .join('\n');

            mainEmbed.addFields({
                name: '📊 Actions par Type',
                value: typeStats || 'Aucune action',
                inline: false
            });

            // Ajouter les statistiques des modérateurs
            if (stats.topModerator) {
                const topMod = await interaction.guild.members.fetch(stats.topModerator).catch(() => null);
                const topModStats = stats.moderators[stats.topModerator];
                mainEmbed.addFields({
                    name: '👑 Modérateur le Plus Actif',
                    value: `${topMod ? topMod.user.tag : stats.topModerator}\n` +
                        `Total: ${topModStats.total} actions\n` +
                        Object.entries(topModStats.byType)
                            .map(([type, count]) => `${getEmojiForType(type)} ${type}: ${count}`)
                            .join('\n'),
                    inline: false
                });
            }

            // Ajouter les actions récentes
            if (filteredActions.length > 0) {
                const recentActionsField = await Promise.all(
                    filteredActions.slice(0, 5).map(async action => {
                        const mod = await interaction.guild.members.fetch(action.moderatorId).catch(() => null);
                        const user = await interaction.guild.members.fetch(action.userId).catch(() => null);
                        return `${getEmojiForType(action.type)} ${action.type} - ` +
                            `${user ? user.user.tag : action.userId} par ` +
                            `${mod ? mod.user.tag : action.moderatorId}\n` +
                            `<t:${Math.floor(action.timestamp.getTime() / 1000)}:R>`;
                    })
                );

                mainEmbed.addFields({
                    name: '🕒 Actions Récentes',
                    value: recentActionsField.join('\n'),
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [mainEmbed] });

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            await interaction.editReply('Une erreur est survenue lors de la récupération des statistiques.');
        }
    }
};

// Fonction utilitaire pour obtenir l'emoji correspondant au type de sanction
function getEmojiForType(type) {
    const emojis = {
        WARN: '⚠️',
        MUTE: '🔇',
        UNMUTE: '🔊',
        BAN: '🔨',
        KICK: '👢'
    };
    return emojis[type] || '❓';
}
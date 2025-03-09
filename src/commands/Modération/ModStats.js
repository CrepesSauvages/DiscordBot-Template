const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const QuickChart = require('quickchart-js');

module.exports = {
    clientPerms: ['Administrator'],
    data: new SlashCommandBuilder()
        .setName('modstats')
        .setDescription('Affiche les statistiques de modération')
        .addStringOption(option =>
            option.setName('période')
                .setDescription('Période des statistiques')
                .setRequired(false)
                .addChoices(
                    { name: '24 heures', value: '1d' },
                    { name: '7 jours', value: '7d' },
                    { name: '30 jours', value: '30d' }
                )),

    async execute(interaction) {
        await interaction.deferReply();

        const timeframe = interaction.options.getString('période') || '7d';
        const stats = await interaction.client.moderationService.getModStats(interaction.guild, timeframe);
        const timeStats = await interaction.client.moderationService.getTimeBasedStats(interaction.guild, timeframe);

        // Créer un seul graphique combiné
        const chart = new QuickChart();
        chart.setConfig({
            type: 'bar',
            data: {
                labels: timeStats.labels,
                datasets: [
                    {
                        label: 'Mutes',
                        data: timeStats.muteData,
                        backgroundColor: '#FFA500'
                    },
                    {
                        label: 'Warns',
                        data: timeStats.warnData,
                        backgroundColor: '#FFFF00'
                    },
                    {
                        label: 'Kicks',
                        data: timeStats.kickData,
                        backgroundColor: '#FF4500'
                    },
                    {
                        label: 'Bans',
                        data: timeStats.banData,
                        backgroundColor: '#FF0000'
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Actions de Modération',
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        })
        .setWidth(800)
        .setHeight(400)
        .setBackgroundColor('white');

        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle('📊 Statistiques de Modération')
            .setDescription(`Statistiques sur ${timeframe === '1d' ? 'les dernières 24 heures' : `les ${timeframe.replace('d', ' derniers jours')}`}`)
            .addFields(
                { 
                    name: '📈 Total des Actions', 
                    value: `${stats.total}`, 
                    inline: false 
                },
                { 
                    name: '🔇 Mutes', 
                    value: `${stats.mutes} (${Math.round(stats.mutes/stats.total*100)}%)`, 
                    inline: true 
                },
                { 
                    name: '⚠️ Warns', 
                    value: `${stats.warns} (${Math.round(stats.warns/stats.total*100)}%)`, 
                    inline: true 
                },
                { 
                    name: '👢 Kicks', 
                    value: `${stats.kicks} (${Math.round(stats.kicks/stats.total*100)}%)`, 
                    inline: true 
                },
                { 
                    name: '🔨 Bans', 
                    value: `${stats.bans} (${Math.round(stats.bans/stats.total*100)}%)`, 
                    inline: true 
                }
            )
            .setImage(chart.getUrl())
            .setTimestamp();

        if (stats.mostActivemod) {
            const modUser = await interaction.client.users.fetch(stats.mostActivemod);
            embed.addFields({ 
                name: '👮 Modérateur le Plus Actif', 
                value: `${modUser.tag} (${stats.mostActivemodActions} actions)`, 
                inline: false 
            });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
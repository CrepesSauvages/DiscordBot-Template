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

        // Créer le graphique en camembert pour les actions
        const pieChart = new QuickChart();
        pieChart
            .setConfig({
                type: 'pie',
                data: {
                    labels: ['Mutes', 'Warns', 'Kicks', 'Bans'],
                    datasets: [{
                        data: [stats.mutes, stats.warns, stats.kicks, stats.bans],
                        backgroundColor: ['#FFA500', '#FFFF00', '#FF4500', '#FF0000']
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Répartition des Actions de Modération'
                        }
                    }
                }
            })
            .setWidth(400)
            .setHeight(300)
            .setBackgroundColor('white');

        // Créer le graphique en barre pour l'évolution dans le temps
        const timeStats = await interaction.client.moderationService.getTimeBasedStats(interaction.guild, timeframe);
        const barChart = new QuickChart();
        barChart
            .setConfig({
                type: 'bar',
                data: {
                    labels: timeStats.labels,
                    datasets: [{
                        label: 'Actions de Modération',
                        data: timeStats.data,
                        backgroundColor: '#7289DA'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Évolution des Actions de Modération'
                        }
                    }
                }
            })
            .setWidth(500)
            .setHeight(300)
            .setBackgroundColor('white');

        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle('📊 Statistiques de Modération')
            .setDescription(`Statistiques sur ${timeframe === '1d' ? 'les dernières 24 heures' : `les ${timeframe.replace('d', ' derniers jours')}`}`)
            .addFields(
                { name: 'Total des Actions', value: `${stats.mutes + stats.warns + stats.kicks + stats.bans}`, inline: true },
                { name: 'Mutes', value: `${stats.mutes}`, inline: true },
                { name: 'Warns', value: `${stats.warns}`, inline: true },
                { name: 'Kicks', value: `${stats.kicks}`, inline: true },
                { name: 'Bans', value: `${stats.bans}`, inline: true }
            )
            .setImage(pieChart.getUrl())
            .setImage(barChart.getUrl())
            .setTimestamp();

        if (stats.mostActivemod) {
            const modUser = await interaction.client.users.fetch(stats.mostActivemod);
            embed.addFields({ 
                name: 'Modérateur le Plus Actif', 
                value: modUser.tag, 
                inline: false 
            });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
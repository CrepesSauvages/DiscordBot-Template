const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { LevelSystem } = require('../../utils/System/Level/levelSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Affiche votre niveau ou celui d\'un autre membre')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Le membre dont vous voulez voir le niveau')
                .setRequired(false)),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const stats = await LevelSystem.getUserStats(targetUser.id, interaction.guildId);
        
        if (stats.error) {
            return interaction.editReply('Une erreur est survenue lors de la récupération des statistiques.');
        }

        const progressBar = createProgressBar(stats.xp, stats.xpNeeded);
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Niveau de ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Niveau', value: `${stats.level}`, inline: true },
                { name: 'Rang', value: `#${stats.rank}`, inline: true },
                { name: 'XP Total', value: `${stats.xp}`, inline: true },
                { name: 'Progression', value: progressBar }
            )
            .setFooter({ text: `XP nécessaire pour le niveau suivant: ${stats.xpNeeded - stats.xp}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};

function createProgressBar(currentXP, neededXP) {
    const progress = Math.min(Math.max(currentXP / neededXP, 0), 1);
    const filledBars = Math.round(progress * 10);
    const emptyBars = 10 - filledBars;
    
    return '█'.repeat(filledBars) + '░'.repeat(emptyBars) + ` ${Math.round(progress * 100)}%`;
}
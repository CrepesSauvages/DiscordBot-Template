const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { LevelSystem } = require('../../utils/System/Level/levelSystem');
const GuildRewards = require('../../utils/Schemas/Level/GuildRewards');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reward')
        .setDescription('Voir les récompenses disponibles')
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('Liste toutes les récompenses disponibles'))
        .addSubcommand(subcommand =>
            subcommand.setName('view')
                .setDescription('Voir vos récompenses')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Voir les récompenses d\'un autre utilisateur')
                        .setRequired(false))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guild = interaction.guild;

        switch (subcommand) {
            case 'list':
                const guildRewards = await GuildRewards.findOne({ guildId: guild.id });
                const embeds = new EmbedBuilder()
                    .setTitle('Récompenses disponibles')
                    .setColor('#00ff00')
                    .setDescription('Voici les récompenses que vous pouvez obtenir !');

                if (!guildRewards || !guildRewards.rewards.length) {
                    embeds.setDescription('Aucune récompense n\'est configurée pour ce serveur.');
                } else {
                    // Trier les récompenses par niveau
                    const sortedRewards = guildRewards.rewards.sort((a, b) => a.level - b.level);
                    
                    for (const reward of sortedRewards) {
                        embeds.addFields({
                            name: `Niveau ${reward.level}`,
                            value: `${reward.type}: ${reward.value}\n${reward.description || 'Pas de description'}`,
                            inline: true
                        });
                    }
                }

                await interaction.reply({ embeds: [embeds] });
                break;

            case 'view':
                const userStats = await LevelSystem.getUserStats(targetUser.id, guild.id);
                const embed = new EmbedBuilder()
                    .setTitle(`Récompenses de ${targetUser.username}`)
                    .setColor('#00ff00')
                    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: 'Niveau actuel', value: `${userStats.level}`, inline: true },
                        { name: 'XP', value: `${userStats.xp}`, inline: true }
                    );

                // Ajouter les récompenses débloquées
                const guildRewardsData = await GuildRewards.findOne({ guildId: guild.id });
                if (guildRewardsData && guildRewardsData.rewards.length) {
                    const unlockedRewards = guildRewardsData.rewards
                        .filter(reward => reward.level <= userStats.level)
                        .sort((a, b) => a.level - b.level);

                    if (unlockedRewards.length) {
                        embed.addFields({
                            name: 'Récompenses débloquées',
                            value: unlockedRewards
                                .map(reward => `Niveau ${reward.level}: ${reward.type} - ${reward.value}`)
                                .join('\n')
                        });
                    }
                }

                await interaction.reply({ embeds: [embed] });
                break;
        }
    }
};
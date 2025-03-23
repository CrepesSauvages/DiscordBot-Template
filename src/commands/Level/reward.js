const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { LevelSystem } = require('../../utils/System/Level/levelSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rewards')
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
                const rewardsConfig = require('../../config/levelRewards.json');
                const embeds = new EmbedBuilder()
                    .setTitle('Récompenses disponibles')
                    .setColor('#00ff00')
                    .setDescription('Voici les récompenses que vous pouvez obtenir !');

                for (const reward of rewardsConfig.rewards) {
                    embeds.addFields({
                        name: `Niveau ${reward.level}`,
                        value: `${reward.type}: ${reward.value}\n${reward.description}`,
                        inline: true
                    });
                }

                await interaction.reply({ embeds: [embeds] });
                break;

            case 'view':
                const member = await guild.members.fetch(targetUser.id);
                const embed = new EmbedBuilder()
                    .setTitle(`Récompenses de ${targetUser.username}`)
                    .setColor('#00ff00')
                    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));

                // À implémenter selon votre système de récompenses
                await interaction.reply({ embeds: [embed] });
                break;
        }
    }
};
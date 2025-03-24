const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildRewards = require('../../utils/Schemas/Level/GuildRewards');

module.exports = {
    userPerms: ['ManageGuild'],
    data: new SlashCommandBuilder()
        .setName('rewards')
        .setDescription('Gestion des récompenses du serveur')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Liste toutes les récompenses du serveur'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Ajoute une récompense')
                .addNumberOption(option => 
                    option.setName('level')
                    .setDescription('Niveau requis')
                    .setRequired(true))
                .addStringOption(option =>
                    option.setName('type')
                    .setDescription('Type de récompense')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Rôle', value: 'role' },
                        { name: 'Badge', value: 'badge' }
                    ))
                .addStringOption(option =>
                    option.setName('value')
                    .setDescription('Nom du rôle ou émoji du badge')
                    .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                    .setDescription('Description de la récompense')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Supprime une récompense')
                .addNumberOption(option =>
                    option.setName('level')
                    .setDescription('Niveau de la récompense')
                    .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'list':
                const rewards = await GuildRewards.findOne({ guildId: interaction.guildId });
                if (!rewards || !rewards.rewards.length) {
                    return interaction.reply('Aucune récompense configurée pour ce serveur.');
                }

                const embed = new EmbedBuilder()
                    .setTitle('🎁 Récompenses du serveur')
                    .setColor('#00ff00')
                    .setDescription(rewards.rewards.map(r => 
                        `**Niveau ${r.level}**: ${r.type === 'role' ? `Rôle @${r.value}` : `Badge ${r.value}`}\n${r.description || ''}`
                    ).join('\n\n'));

                await interaction.reply({ embeds: [embed] });
                break;

            case 'add':
                // ... logique d'ajout ...
                break;

            case 'remove':
                // ... logique de suppression ...
                break;
        }
    }
}; 
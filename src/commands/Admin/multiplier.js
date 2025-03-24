const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../../utils/Schemas/Level/GuildSettings');

module.exports = {
    userPerms: ['ManageGuild'],
    data: new SlashCommandBuilder()
        .setName('multiplier')
        .setDescription('Gestion des multiplicateurs XP')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Ajoute un multiplicateur XP')
                .addStringOption(option =>
                    option.setName('type')
                    .setDescription('Type de multiplicateur')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Rôle', value: 'role' },
                        { name: 'Canal', value: 'channel' }
                    ))
                .addStringOption(option =>
                    option.setName('target')
                    .setDescription('ID du rôle ou du canal')
                    .setRequired(true))
                .addNumberOption(option =>
                    option.setName('multiplier')
                    .setDescription('Valeur du multiplicateur (1.5 = +50% XP)')
                    .setRequired(true))
                .addNumberOption(option =>
                    option.setName('duration')
                    .setDescription('Durée en heures (optionnel)')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Supprime un multiplicateur')
                .addStringOption(option =>
                    option.setName('target')
                    .setDescription('ID du rôle ou du canal')
                    .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Liste tous les multiplicateurs actifs'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'add':
                const type = interaction.options.getString('type');
                const targetId = interaction.options.getString('target');
                const multiplier = interaction.options.getNumber('multiplier');
                const duration = interaction.options.getNumber('duration');

                let endDate = null;
                if (duration) {
                    endDate = new Date(Date.now() + duration * 3600000);
                }

                await GuildSettings.findOneAndUpdate(
                    { guildId: interaction.guildId },
                    {
                        $push: {
                            xpMultipliers: {
                                type,
                                targetId,
                                multiplier,
                                endDate
                            }
                        }
                    },
                    { upsert: true }
                );

                await interaction.reply(`Multiplicateur x${multiplier} ajouté pour le ${type} ${targetId}`);
                break;

            case 'list':
                const settings = await GuildSettings.findOne({ guildId: interaction.guildId });
                if (!settings || !settings.xpMultipliers.length) {
                    return interaction.reply('Aucun multiplicateur actif.');
                }

                const multipliers = settings.xpMultipliers.map(m => 
                    `**${m.type}** (${m.targetId}): x${m.multiplier}${m.endDate ? `\nExpire le: ${m.endDate.toLocaleString()}` : ''}`
                ).join('\n\n');

                await interaction.reply(`**Multiplicateurs actifs:**\n${multipliers}`);
                break;

            case 'remove':
                // ... logique de suppression ...
                break;
        }
    }
}; 
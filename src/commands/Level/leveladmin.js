const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { LevelSystem } = require('../../utils/System/Level/levelSystem');

module.exports = {
    userPerms: ['Administrator'],
    data: new SlashCommandBuilder()
        .setName('leveladmin')
        .setDescription("Commandes d'administration pour le système de niveaux")        .addSubcommand(subcommand =>
            subcommand.setName('reset')
                .setDescription("Réinitialiser les niveaux d'un utilisateur")
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription("Utilisateur à réinitialiser")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('setlevel')
                .setDescription("Définir le niveau d'un utilisateur")
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription("Utilisateur à modifier")
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('level')
                        .setDescription("Niveau à définir")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('setxp')
                .setDescription("Définir l'XP d'un utilisateur")
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription("Utilisateur à modifier")
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('xp')
                        .setDescription("XP à définir")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('addxp')
                .setDescription("Ajouter de l'XP à un utilisateur")
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription("Utilisateur à modifier")
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('xp')
                        .setDescription("XP à ajouter")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('addreward')
                .setDescription("Ajouter une récompense")
                .addNumberOption(option =>
                    option.setName('level')
                        .setDescription("Niveau de la récompense")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription("Type de récompense (role, badge)")
                        .setRequired(true)
                        .addChoices(
                            { name: 'role', value: 'role' },
                            { name: 'badge', value: 'badge' }
                        ))
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription("Valeur de la récompense (nom du rôle ou badge)")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription("Description de la récompense")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('removereward')
                .setDescription("Supprimer une récompense")
                .addNumberOption(option =>
                    option.setName('level')
                        .setDescription("Niveau de la récompense")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription("Type de récompense")
                        .setRequired(true)
                        .addChoices(
                            { name: 'role', value: 'role' },
                            { name: 'badge', value: 'badge' }
                        ))
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription("Valeur de la récompense")
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const level = interaction.options.getNumber('level');
        const xp = interaction.options.getNumber('xp');
        const type = interaction.options.getString('type');
        const value = interaction.options.getString('value');
        const description = interaction.options.getString('description');

        try {
            switch (subcommand) {
                case 'reset':
                    await LevelSystem.resetUser(user.id, interaction.guildId);
                    await interaction.reply(`Les niveaux de ${user} ont été réinitialisés.`);
                    break;

                case 'setlevel':
                    await LevelSystem.setLevel(user.id, interaction.guildId, level);
                    await interaction.reply(`Le niveau de ${user} a été défini à ${level}.`);
                    break;

                case 'setxp':
                    await LevelSystem.setXP(user.id, interaction.guildId, xp);
                    await interaction.reply(`L'XP de ${user} a été définie à ${xp}.`);
                    break;

                case 'addxp':
                    await LevelSystem.addXP(user.id, interaction.guildId, xp, interaction.client);
                    await interaction.reply(`Ajouté ${xp} XP à ${user}.`);
                    break;

                case 'addreward':
                    await LevelSystem.addReward(level, type, value, description);
                    await interaction.reply(`Récompense ajoutée pour le niveau ${level}.`);
                    break;

                case 'removereward':
                    await LevelSystem.removeReward(level, type, value);
                    await interaction.reply(`Récompense supprimée pour le niveau ${level}.`);
                    break;
            }
        } catch (error) {
            console.error('Erreur dans levelAdmin:', error);
            await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
        }
    }
};
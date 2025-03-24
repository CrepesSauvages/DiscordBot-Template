const { SlashCommandBuilder } = require('discord.js');
const { migrateRewards } = require('../../utils/migrations/migrateRewards');

module.exports = {
    userPerms: ['ManageGuild'],
    data: new SlashCommandBuilder()
        .setName('migrate-rewards')
        .setDescription('Migre les récompenses du système de niveau vers la base de données'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const success = await migrateRewards(interaction.client);
            
            if (success) {
                await interaction.editReply({
                    content: '✅ Migration des récompenses effectuée avec succès!'
                });
            } else {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue pendant la migration. Vérifiez les logs pour plus de détails.'
                });
            }
        } catch (error) {
            console.error('Erreur dans la commande migrate-rewards:', error);
            await interaction.editReply({
                content: '❌ Une erreur inattendue est survenue.'
            });
        }
    }
};
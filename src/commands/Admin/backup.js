const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const BackupManager = require('../../utils/System/BackupManager');

module.exports = {
    userPerms: ['Administrator'],
    cooldown: 60,
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Gérer les sauvegardes du serveur')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Créer une nouvelle sauvegarde')
                .addBooleanOption(option =>
                    option
                        .setName('include_messages')
                        .setDescription('Inclure les messages importants?')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lister les sauvegardes disponibles'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('load')
                .setDescription('Charger une sauvegarde')
                .addStringOption(option =>
                    option
                        .setName('backup_id')
                        .setDescription('ID de la sauvegarde à restaurer')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Supprimer une sauvegarde')
                .addStringOption(option =>
                    option
                        .setName('backup_id')
                        .setDescription('ID de la sauvegarde à supprimer')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const backupManager = new BackupManager(interaction.client);

        switch (subcommand) {
            case 'create':
                await handleCreate(interaction, backupManager);
                break;
            case 'list':
                await handleList(interaction, backupManager);
                break;
            case 'load':
                await handleLoad(interaction, backupManager);
                break;
            case 'delete':
                await handleDelete(interaction, backupManager);
                break;
        }
    }
};

async function handleCreate(interaction, backupManager) {
    await interaction.deferReply();
    const includeMessages = interaction.options.getBoolean('include_messages') ?? false;

    try {
        const backup = await backupManager.createBackup(interaction.guild, includeMessages);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Sauvegarde Créée')
            .setDescription(`Une nouvelle sauvegarde a été créée pour ${interaction.guild.name}`)
            .addFields(
                { name: '📋 ID de la Sauvegarde', value: `\`${backup.id}\``, inline: true },
                { name: '📎 Messages Inclus', value: includeMessages ? 'Oui' : 'Non', inline: true },
                { name: '⏰ Créée le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: '🔄 Commande de Restauration', value: `\`/backup load backup_id:${backup.id}\`` }
            )
            .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Erreur')
            .setDescription(`Une erreur est survenue lors de la création de la sauvegarde:\n\`\`\`${error.message}\`\`\``)
            .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
    }
}

async function handleList(interaction, backupManager) {
    const backups = await backupManager.listBackups(interaction.guild.id);
    
    if (backups.length === 0) {
        const emptyEmbed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('📂 Aucune Sauvegarde')
            .setDescription('Aucune sauvegarde n\'a été trouvée pour ce serveur.')
            .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.reply({ embeds: [emptyEmbed], ephemeral: true });
    }

    const backupList = backups.map((backup, index) => {
        const date = new Date(backup.createdAt);
        return `\`${index + 1}.\` ID: \`${backup.id}\`\n📅 <t:${Math.floor(date.getTime() / 1000)}:F>\n📎 ${backup.includeMessages ? 'Avec messages' : 'Sans messages'}\n`;
    }).join('\n');

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📋 Liste des Sauvegardes')
        .setDescription(backupList)
        .setFooter({ text: `${backups.length} sauvegarde(s) • ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleLoad(interaction, backupManager) {
    await interaction.deferReply({ ephemeral: true });
    const backupId = interaction.options.getString('backup_id');

    const confirmEmbed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('⚠️ Confirmation de Restauration')
        .setDescription('Cette action va remplacer la configuration actuelle du serveur. Êtes-vous sûr de vouloir continuer ?')
        .addFields(
            { name: '📋 ID de la Sauvegarde', value: `\`${backupId}\`` },
            { name: '⚠️ Attention', value: 'Cette action est irréversible!' }
        )
        .setFooter({ text: 'La restauration commencera dans 10 secondes...', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    await interaction.editReply({ embeds: [confirmEmbed], ephemeral: true });

    try {
        // Attendre 10 secondes
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Message de progression
        const loadingEmbed = new EmbedBuilder()
            .setColor('#ffff00')
            .setTitle('⏳ Restauration en cours')
            .setDescription('La restauration de la sauvegarde est en cours...')
            .setFooter({ text: 'Veuillez patienter...', iconURL: interaction.guild.iconURL() });

        await interaction.editReply({ embeds: [loadingEmbed], ephemeral: true });

        // Effectuer la restauration
        await backupManager.loadBackup(interaction.guild, backupId);

        // Message de succès
        const successEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Restauration Réussie')
            .setDescription('La sauvegarde a été restaurée avec succès!')
            .setFooter({ text: `Restauré par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed], ephemeral: true }).catch(() => {
            // Si le message ne peut pas être édité, envoyer un nouveau message
            interaction.followUp({ embeds: [successEmbed], ephemeral: true });
        });
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Erreur')
            .setDescription(`Une erreur est survenue lors de la restauration:\n\`\`\`${error.message}\`\`\``)
            .setTimestamp();

        // Essayer d'éditer le message, sinon envoyer un nouveau
        await interaction.editReply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {
            interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        });
    }
}

async function handleDelete(interaction, backupManager) {
    const backupId = interaction.options.getString('backup_id');

    try {
        await backupManager.deleteBackup(interaction.guild.id, backupId);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🗑️ Sauvegarde Supprimée')
            .setDescription(`La sauvegarde \`${backupId}\` a été supprimée avec succès.`)
            .setFooter({ text: `Supprimé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Erreur')
            .setDescription(`Une erreur est survenue lors de la suppression:\n\`\`\`${error.message}\`\`\``)
            .setTimestamp();

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
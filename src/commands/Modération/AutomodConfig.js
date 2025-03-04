const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    userPerms: ['Administrator'],
    clientPerms: ['Administrator'],
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configurer l\'automod')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Voir la configuration actuelle'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Activer/désactiver l\'automod')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type de sanction')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Tout', value: 'all' },
                            { name: 'Mute', value: 'mute' },
                            { name: 'Kick', value: 'kick' },
                            { name: 'Ban', value: 'ban' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('threshold')
                .setDescription('Modifier les seuils')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type de sanction')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Mute', value: 'mute' },
                            { name: 'Kick', value: 'kick' },
                            { name: 'Ban', value: 'ban' }
                        ))
                .addIntegerOption(option =>
                    option
                        .setName('amount')
                        .setDescription('Nombre de sanctions avant action')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(20)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('muteduration')
                .setDescription('Modifier la durée du mute automatique')
                .addStringOption(option =>
                    option
                        .setName('duration')
                        .setDescription('Durée (ex: 1h, 1d, 7d)')
                        .setRequired(true))),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'view': {
                const config = await client.moderationService.getAutomodConfig(interaction.guild.id);
                const embed = {
                    color: 0x0099FF,
                    title: '⚙️ Configuration de l\'Automod',
                    fields: [
                        {
                            name: 'État général',
                            value: config.enabled ? '✅ Activé' : '❌ Désactivé'
                        },
                        {
                            name: '🔇 Mute automatique',
                            value: `État: ${config.mute.enabled ? '✅' : '❌'}\nSeuil: ${config.mute.threshold} sanctions\nDurée: ${config.mute.duration}`
                        },
                        {
                            name: '👢 Kick automatique',
                            value: `État: ${config.kick.enabled ? '✅' : '❌'}\nSeuil: ${config.kick.threshold} sanctions`
                        },
                        {
                            name: '🔨 Ban automatique',
                            value: `État: ${config.ban.enabled ? '✅' : '❌'}\nSeuil: ${config.ban.threshold} sanctions`
                        }
                    ]
                };
                
                await interaction.reply({ embeds: [embed] });
                break;
            }
            
            case 'toggle': {
                const type = interaction.options.getString('type');
                const config = await client.moderationService.getAutomodConfig(interaction.guild.id);
                
                if (type === 'all') {
                    config.enabled = !config.enabled;
                } else {
                    config[type].enabled = !config[type].enabled;
                }
                
                await config.save();
                
                await interaction.reply(`L'automod ${type === 'all' ? 'général' : type} a été ${config[type === 'all' ? 'enabled' : `${type}.enabled`] ? 'activé' : 'désactivé'}`);
                break;
            }
            
            case 'threshold': {
                const type = interaction.options.getString('type');
                const amount = interaction.options.getInteger('amount');
                
                const update = { [`${type}.threshold`]: amount };
                await client.moderationService.updateAutomodConfig(interaction.guild.id, update);
                
                await interaction.reply(`Le seuil de ${type} a été mis à jour à ${amount} sanctions`);
                break;
            }
            
            case 'muteduration': {
                const duration = interaction.options.getString('duration');
                
                const update = { 'mute.duration': duration };
                await client.moderationService.updateAutomodConfig(interaction.guild.id, update);
                
                await interaction.reply(`La durée du mute automatique a été mise à jour à ${duration}`);
                break;
            }
        }
    }
}; 
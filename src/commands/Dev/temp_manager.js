const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Fonction de validation du nom de commande
function isValidCommandName(name) {
    // Les noms de commandes Discord doivent :
    // - Être en minuscules
    // - Ne contenir que des lettres, chiffres, tirets et underscores
    // - Avoir entre 1 et 32 caractères
    const regex = /^[\w-]{1,32}$/;
    return name.toLowerCase() === name && regex.test(name);
}

module.exports = {
    dev: true,
    data: new SlashCommandBuilder()
        .setName('temp')
        .setDescription('Gestion des commandes temporaires')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Créer une nouvelle commande temporaire')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Nom de la commande')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description de la commande')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('duration')
                        .setDescription('Durée en minutes')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('response')
                        .setDescription('Réponse de la commande')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Liste toutes les commandes temporaires'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Supprime une commande temporaire')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Nom de la commande')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('extend')
                .setDescription('Prolonge la durée d\'une commande temporaire')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Nom de la commande')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('minutes')
                        .setDescription('Minutes à ajouter')
                        .setRequired(true))),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'create': {
                const name = interaction.options.getString('name');
                
                // Validation du nom de commande
                if (!isValidCommandName(name)) {
                    await interaction.reply({
                        content: '❌ Nom de commande invalide. Le nom doit :\n' +
                                '- Être en minuscules\n' +
                                '- Ne contenir que des lettres, chiffres, tirets et underscores\n' +
                                '- Avoir entre 1 et 32 caractères',
                        ephemeral: true
                    });
                    return;
                }

                const description = interaction.options.getString('description');
                const duration = interaction.options.getInteger('duration') * 60000;
                const response = interaction.options.getString('response');

                // Vérification si la commande existe déjà
                if (client.commands.has(name) || client.tempCommands.tempCommands.has(name)) {
                    await interaction.reply({
                        content: `❌ Une commande nommée \`${name}\` existe déjà`,
                        ephemeral: true
                    });
                    return;
                }

                const commandData = {
                    data: new SlashCommandBuilder()
                        .setName(name.toLowerCase()) // Assure que le nom est en minuscules
                        .setDescription(description),
                    execute: async (i) => {
                        await i.reply(response);
                    }
                };

                client.tempCommands.create(name, commandData, duration);

                // Enregistrer la commande auprès de Discord
                try {
                    await client.application.commands.create({
                        name: name,
                        description: description
                    });

                    await interaction.reply({
                        content: `✅ Commande temporaire \`${name}\` créée pour ${duration/60000} minutes`,
                        ephemeral: true
                    });
                } catch (error) {
                    client.logs.error(`Erreur lors de la création de la commande: ${error}`);
                    await interaction.reply({
                        content: `❌ Erreur lors de la création de la commande: ${error.message}`,
                        ephemeral: true
                    });
                }
                break;
            }

            case 'list': {
                const commands = Array.from(client.tempCommands.tempCommands.entries()).map(([name, cmd]) => {
                    const timeLeft = Math.max(0, (cmd.expiresAt - Date.now()) / 1000 / 60);
                    return `\`${name}\` - Expire dans ${timeLeft.toFixed(1)} minutes`;
                });

                const embed = new EmbedBuilder()
                    .setTitle('📋 Commandes Temporaires')
                    .setDescription(commands.length ? commands.join('\n') : 'Aucune commande temporaire active')
                    .setColor('#2f3136')
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }

            case 'delete': {
                const name = interaction.options.getString('name');
                
                if (!client.tempCommands.tempCommands.has(name)) {
                    await interaction.reply({
                        content: `❌ La commande \`${name}\` n'existe pas`,
                        ephemeral: true
                    });
                    return;
                }

                client.tempCommands.delete(name);
                
                // Supprimer la commande de Discord
                try {
                    const command = await client.application.commands.cache.find(cmd => cmd.name === name);
                    if (command) await command.delete();

                    await interaction.reply({
                        content: `✅ Commande temporaire \`${name}\` supprimée`,
                        ephemeral: true
                    });
                } catch (error) {
                    await interaction.reply({
                        content: `❌ Erreur lors de la suppression de la commande: ${error.message}`,
                        ephemeral: true
                    });
                }
                break;
            }

            case 'extend': {
                const name = interaction.options.getString('name');
                const minutes = interaction.options.getInteger('minutes');
                
                const command = client.tempCommands.tempCommands.get(name);
                if (!command) {
                    await interaction.reply({
                        content: `❌ La commande \`${name}\` n'existe pas`,
                        ephemeral: true
                    });
                    return;
                }

                command.expiresAt += minutes * 60000;
                client.tempCommands.tempCommands.set(name, command);

                await interaction.reply({
                    content: `✅ Durée de la commande \`${name}\` prolongée de ${minutes} minutes`,
                    ephemeral: true
                });
                break;
            }
        }
    }
}; 
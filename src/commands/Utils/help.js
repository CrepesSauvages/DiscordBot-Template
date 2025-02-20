const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche la liste des commandes')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Catégorie spécifique à afficher')
                .setRequired(false)),

    async execute(interaction, client) {
        const locale = await client.locales.getGuildLocale(interaction.guildId);
        const category = interaction.options.getString('category');
        
        const commandsPath = path.join(__dirname, '..');
        const categories = fs.readdirSync(commandsPath);
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(client.locales.translate('commands.help.title', locale))
            .setTimestamp();

        try {
            if (category) {
                if (!categories.includes(category)) {
                    return await interaction.reply({
                        content: client.locales.translate('commands.help.invalid_category', locale),
                        ephemeral: true
                    });
                }

                const commands = getCommandsInCategory(category, commandsPath, client, interaction.user.id);
                embed.setDescription(client.locales.translate('commands.help.category_description', locale, { category }));
                
                if (commands.length > 0) {
                    embed.addFields({
                        name: `📁 ${category}`,
                        value: commands.map(cmd => `\`/${cmd.name}\` - ${cmd.description}`).join('\n'),
                        inline: false
                    });
                }
            } else {
                for (const cat of categories) {
                    const commands = getCommandsInCategory(cat, commandsPath, client, interaction.user.id);
                    if (commands.length > 0) {
                        embed.addFields({
                            name: `📁 ${cat}`,
                            value: commands.map(cmd => `\`/${cmd.name}\` - ${cmd.description}`).join('\n'),
                            inline: false
                        });
                    }
                }
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            client.logs.error(`Erreur commande help: ${error.message}`);
            await interaction.reply({
                content: client.locales.translate('errors.unexpected_error', locale),
                ephemeral: true
            });
        }
    }
};

function getCommandsInCategory(category, commandsPath, client, userId) {
    const categoryPath = path.join(commandsPath, category);
    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
    
    return commandFiles.map(file => {
        const command = require(path.join(categoryPath, file));
        if (command.dev && !client.config.devs?.includes(userId)) {
            return null;
        }
        return {
            name: command.data.name,
            description: command.data.description
        };
    }).filter(cmd => cmd !== null);
} 
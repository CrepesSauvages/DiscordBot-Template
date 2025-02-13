const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    dev: true,
    guilds: ['1197542985601138708'],
    roles: ['1199739724156391504'],
    users: ['562667788645171201'],
    cooldown: 5,
    userPerms: ['ManageGuild'],
    clientPerms: ['Administrator'],
    data: new SlashCommandBuilder()
        .setName("database")
        .setDescription("Interagit avec la base de données")
        .addStringOption(option =>
            option.setName("action")
                .setDescription("Action à effectuer (set, get, delete, createTable)")
                .setRequired(true)
                .addChoices(
                    { name: "Set (ajouter/modifier)", value: "set" },
                    { name: "Get (récupérer)", value: "get" },
                    { name: "Delete (supprimer)", value: "delete" },
                    { name: "Create Table (créer une table)", value: "createTable" }
                )
        )
        .addStringOption(option =>
            option.setName("key")
                .setDescription("Clé à utiliser")
                .setRequired(true)
                .setAutocomplete(false)
        )
        .addStringOption(option =>
            option.setName("value")
                .setDescription("Valeur à stocker (nécessaire pour 'set')")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("columns")
                .setDescription("Colonnes pour créer une table (nécessaire pour 'createTable')")
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const action = interaction.options.getString("action");
        const key = interaction.options.getString("key");
        const value = interaction.options.getString("value");
        const columns = interaction.options.getString("columns");
        try {
            if (action === "set") {
                if (!value) return interaction.reply({ content: "❌ Vous devez fournir une valeur pour 'set'!", ephemeral: true });

                await interaction.client.database.set(key, value);
                await interaction.reply(`✅ Clé **${key}** enregistrée avec la valeur **${value}**.`);
            }
            else if (action === "get") {
                const result = await interaction.client.database.get(key);
                if (!result) return interaction.reply({ content: `❌ Clé **${key}** introuvable!`, ephemeral: true });

                await interaction.reply(`📦 **${key}** → ${result}`);
            }
            else if (action === "delete") {
                const deleted = await interaction.client.database.delete(key);
                if (!deleted) return interaction.reply({ content: `❌ Clé **${key}** introuvable!`, ephemeral: true });

                await interaction.reply(`🗑️ Clé **${key}** supprimée avec succès.`);
            }
            else if (action === "createTable") {
                if (!columns) return interaction.reply({ content: "❌ Vous devez fournir des colonnes pour 'createTable'!", ephemeral: true });

                const columnsArray = columns.split(",").map(col => {
                    const [name, type] = col.trim().split(" ");
                    return { name, type };
                });

                await interaction.client.database.createTable(key, columnsArray);
                await interaction.reply(`✅ Table **${key}** créée avec les colonnes **${columns}**.`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "❌ Une erreur s'est produite lors de l'interaction avec la base de données.", ephemeral: true });
        }
    },
};

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
                .setDescription("Action à effectuer (set, get, delete)")
                .setRequired(true)
                .addChoices(
                    { name: "Set (ajouter/modifier)", value: "set" },
                    { name: "Get (récupérer)", value: "get" },
                    { name: "Delete (supprimer)", value: "delete" }
                )
        )
        .addStringOption(option =>
            option.setName("key")
                .setDescription("Clé à utiliser")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("value")
                .setDescription("Valeur à stocker (nécessaire pour 'set')")
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const action = interaction.options.getString("action");
        const key = interaction.options.getString("key");
        const value = interaction.options.getString("value");

        try {
            const db = interaction.client.database;

            if (action === "set") {
                if (!value) return interaction.reply({ content: "❌ Vous devez fournir une valeur pour 'set'!", ephemeral: true });

                await db.create("bot_data", { key, value });
                await interaction.reply(`✅ Clé **${key}** enregistrée avec la valeur **${value}**.`);
            }
            else if (action === "get") {
                const result = await db.find("bot_data", { key });
                if (!result.length) return interaction.reply({ content: `❌ Clé **${key}** introuvable!`, ephemeral: true });

                await interaction.reply(`📦 **${key}** → ${result[0].value}`);
            }
            else if (action === "delete") {
                const deleted = await db.delete("bot_data", { key });
                if (!deleted.deletedCount) return interaction.reply({ content: `❌ Clé **${key}** introuvable!`, ephemeral: true });

                await interaction.reply(`🗑️ Clé **${key}** supprimée avec succès.`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "❌ Une erreur s'est produite lors de l'interaction avec la base de données.", ephemeral: true });
        }
    },
};

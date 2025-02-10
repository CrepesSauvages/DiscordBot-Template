const { SlashCommandBuilder } = require("discord.js");
const DatabaseModel = require("../../utils/Schemas/DataBase/DataBase");

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
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName("value")
                .setDescription("Valeur à stocker (nécessaire pour 'set')")
                .setRequired(false)
        ),

    autocomplete: async function (interaction) {
        const focusedValue = interaction.options.getFocused(); // Récupère ce que l'utilisateur tape
        const keys = await DatabaseModel.find().select("key -_id").lean(); // Récupère toutes les clés

        // Filtrer les clés qui correspondent à l'entrée de l'utilisateur
        const filtered = keys
            .map(entry => entry.key)
            .filter(key => key.startsWith(focusedValue))
            .slice(0, 25); // Discord autorise max 25 suggestions

        await interaction.respond(filtered.map(key => ({ name: key, value: key })));
    },
    async execute(interaction) {
        const action = interaction.options.getString("action");
        const key = interaction.options.getString("key");
        const value = interaction.options.getString("value");

        try {
            if (action === "set") {
                if (!value) return interaction.reply({ content: "❌ Vous devez fournir une valeur pour 'set'!", ephemeral: true });

                await DatabaseModel.findOneAndUpdate(
                    { key },
                    { key, value },
                    { upsert: true, new: true }
                );

                await interaction.reply(`✅ Clé **${key}** enregistrée avec la valeur **${value}**.`);
            }
            else if (action === "get") {
                const entry = await DatabaseModel.findOne({ key });

                if (!entry) return interaction.reply({ content: `❌ Clé **${key}** introuvable!`, ephemeral: true });

                await interaction.reply(`📦 **${key}** → ${entry.value}`);
            }
            else if (action === "delete") {
                const result = await DatabaseModel.findOneAndDelete({ key });

                if (!result) return interaction.reply({ content: `❌ Clé **${key}** introuvable!`, ephemeral: true });

                await interaction.reply(`🗑️ Clé **${key}** supprimée avec succès.`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "❌ Une erreur s'est produite lors de l'interaction avec la base de données.", ephemeral: true });
        }
    },
};

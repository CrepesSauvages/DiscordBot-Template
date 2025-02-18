const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const DatabaseModel = require("../../utils/Schemas/DataBase/DataBase"); // Import du modèle MongoDB

module.exports = {
    dev: true,
    guilds: ['1197542985601138708'],
    roles: ['1199739724156391504'],
    users: ['562667788645171201'],
    cooldown: 5,
    userPerms: ['ManageGuild'],
    clientPerms: ['Administrator'],
    data: new SlashCommandBuilder()
        .setName('testbot')
        .setDescription('Teste toutes les fonctionnalités du bot'),

    async execute(interaction) {
            // 🔹 TEST BOUTONS 🔹
            const buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('test_button')
                    .setLabel('📌 Bouton')
                    .setStyle(ButtonStyle.Primary)
            );

            // 🔹 TEST MENUS DÉROULANTS 🔹
            const menuRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('test_menu')
                    .setPlaceholder('🔽 Choisir une option')
                    .addOptions([
                        { label: 'Option 1', value: 'option1' },
                        { label: 'Option 2', value: 'option2' },
                        { label: 'Option 3', value: 'option3' },
                    ])
            );

            const modal = new ModalBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('questionID')
                    .setPlaceholder('Entrez quelque chose...')
                    .setMaxLength(100)
                    .setMinLength(10)
            )

            // 🔹 TEST BASE DE DONNÉES 🔹
            const testKey = "test_bot_function";
            const testValue = "MongoDB fonctionne !";
            await DatabaseModel.findOneAndUpdate(
                { key: testKey },
                { value: testValue },
                { upsert: true, new: true }
            );
            const latestEntry = await DatabaseModel.findOne({ key: testKey });

            // 🔹 ENVOI DU MESSAGE INTERACTIF 🔹
            await interaction.reply({
                content: `🚀 **Test du bot !**\n\n✅ Bouton\n✅ Menu déroulant\n✅ Base de données : **${latestEntry.value}**\n\n📩 Teste aussi le modal en cliquant sur le bouton.`,
                components: [buttonRow, menuRow, modal],
                ephemeral: true
            });

    },
};

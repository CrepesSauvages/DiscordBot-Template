module.exports = {
    customID: 'test_menu',
    async execute(interaction) {
        const selection = interaction.values[0];
        await interaction.reply(`You selected ${selection}`);
    }
};
module.exports = {
    customID: 'test_button',
    async execute(interaction) {
        await interaction.reply('Button clicked!');
    }
};
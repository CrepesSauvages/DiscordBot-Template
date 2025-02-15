module.exports = {
    customID: 'test_modal',
    async execute(interaction) {
        const firstAnswer = interaction.fields.getTextInputValue('questionID');
        const secondAnswer = interaction.fields.getTextInputValue('another_question');
        await interaction.reply(`You answered "${firstAnswer}" and "${secondAnswer}"`);
    }
};
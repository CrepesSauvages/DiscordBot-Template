module.exports = {
  customID: 'cancel_close_ticket',
  
  async execute(interaction, client, args) {
    await interaction.reply({
      content: 'Fermeture du ticket annulée.',
      ephemeral: true
    });
  }
}; 
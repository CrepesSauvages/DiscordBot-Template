const { EmbedBuilder } = require('discord.js');

module.exports = {
  customID: 'cancel_close_ticket',
  
  execute: async function(interaction) {
    try {
      await interaction.reply({
        content: "La fermeture du ticket a été annulée.",
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue.',
        ephemeral: true
      });
    }
  }
}; 
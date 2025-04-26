const { EmbedBuilder } = require('discord.js');
const TicketConfig = require('../../../utils/Schemas/Ticket/TicketConfig');

module.exports = {
  customID: 'select_discord_category',
  
  execute: async function(interaction, client) {
    try {
      // Récupérer les données temporaires
      if (!client.ticketSetupTemp || !client.ticketSetupTemp.has(interaction.user.id)) {
        return interaction.reply({
          content: "Vous devez d'abord sélectionner une catégorie de ticket.",
          ephemeral: true
        });
      }
      
      const { ticketCategoryIndex } = client.ticketSetupTemp.get(interaction.user.id);
      const discordCategoryId = interaction.values[0];
      
      // Récupérer la configuration des tickets
      let ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
      if (!ticketConfig || !ticketConfig.categories[ticketCategoryIndex]) {
        return interaction.reply({
          content: "Catégorie de ticket introuvable.",
          ephemeral: true
        });
      }
      
      // Mettre à jour la catégorie parente
      ticketConfig.categories[ticketCategoryIndex].categoryChannel = discordCategoryId;
      await ticketConfig.save();
      
      // Nettoyer les données temporaires
      client.ticketSetupTemp.delete(interaction.user.id);
      
      const discordCategory = interaction.guild.channels.cache.get(discordCategoryId);
      
      await interaction.reply({
        content: `La catégorie Discord "${discordCategory.name}" a été assignée à la catégorie de ticket "${ticketConfig.categories[ticketCategoryIndex].name}".`,
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la configuration de la catégorie.',
        ephemeral: true
      });
    }
  }
}; 
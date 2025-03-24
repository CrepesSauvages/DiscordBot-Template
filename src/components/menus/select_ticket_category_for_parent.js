const { ChannelType, EmbedBuilder } = require('discord.js');
const TicketConfig = require('../../utils/Schemas/Ticket/TicketConfig');

module.exports = {
  customID: 'select_ticket_category_for_parent',
  
  execute: async function(interaction, client) {
    try {
      // Stocker la catégorie de ticket sélectionnée dans les métadonnées de l'interaction
      const ticketCategoryIndex = interaction.values[0];
      
      // Récupérer la configuration des tickets
      const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
      if (!ticketConfig || !ticketConfig.categories[ticketCategoryIndex]) {
        return interaction.reply({
          content: "Catégorie de ticket introuvable.",
          ephemeral: true
        });
      }
      
      // Stocker temporairement l'index de la catégorie sélectionnée
      // Comme Discord.js n'offre pas de stockage temporaire pour les interactions,
      // nous utilisons une propriété sur le client
      if (!client.ticketSetupTemp) client.ticketSetupTemp = new Map();
      client.ticketSetupTemp.set(interaction.user.id, {
        ticketCategoryIndex: parseInt(ticketCategoryIndex)
      });
      
      await interaction.reply({
        content: `Catégorie de ticket "${ticketConfig.categories[ticketCategoryIndex].name}" sélectionnée. Veuillez maintenant sélectionner une catégorie Discord dans le menu ci-dessous.`,
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la sélection de la catégorie.',
        ephemeral: true
      });
    }
  }
}; 
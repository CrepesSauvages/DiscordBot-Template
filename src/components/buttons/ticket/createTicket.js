const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const TicketConfig = require('../../../utils/Schemas/Ticket/TicketConfig');

module.exports = {
  customID: 'create_ticket',
  
  async execute(interaction, client, args) {
    try {
      // Récupérer la configuration des tickets pour ce serveur
      const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
      
      if (!ticketConfig || ticketConfig.categories.length === 0) {
        return interaction.reply({
          content: "Aucune catégorie de ticket n'a été configurée pour ce serveur.",
          ephemeral: true
        });
      }
      
      // Créer un menu de sélection avec les catégories disponibles
      const select = new StringSelectMenuBuilder()
        .setCustomId('ticket_category_select')
        .setPlaceholder('Sélectionnez une catégorie de ticket')
        .setMinValues(1)
        .setMaxValues(1);
      
      // Ajouter les options au menu
      ticketConfig.categories.forEach(category => {
        select.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(category.name)
            .setDescription(category.description.substring(0, 100))
            .setValue(category.name)
            .setEmoji(category.emoji || '🎫')
        );
      });
      
      const row = new ActionRowBuilder().addComponents(select);
      
      const embed = new EmbedBuilder()
        .setTitle('Création d\'un ticket')
        .setDescription('Veuillez sélectionner la catégorie qui correspond à votre demande.')
        .setColor('#0099ff');
      
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la création du ticket.',
        ephemeral: true
      });
    }
  }
}; 
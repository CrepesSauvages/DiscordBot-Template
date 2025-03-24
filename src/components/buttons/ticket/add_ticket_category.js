const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customID: 'add_ticket_category',
  
  execute: async function(interaction, client) {
    // Créer un modal pour ajouter une catégorie
    const modal = new ModalBuilder()
      .setCustomId('ticket_category_modal')
      .setTitle('Ajouter une catégorie de ticket');
    
    const nameInput = new TextInputBuilder()
      .setCustomId('categoryName')
      .setLabel('Nom de la catégorie')
      .setPlaceholder('Support technique')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    
    const descriptionInput = new TextInputBuilder()
      .setCustomId('categoryDescription')
      .setLabel('Description de la catégorie')
      .setPlaceholder('Pour toute aide technique ou problème avec nos services')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);
    
    const emojiInput = new TextInputBuilder()
      .setCustomId('categoryEmoji')
      .setLabel('Emoji (optionnel)')
      .setPlaceholder('🔧')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);
    
    const colorInput = new TextInputBuilder()
      .setCustomId('categoryColor')
      .setLabel('Couleur HEX (optionnel)')
      .setPlaceholder('#0099ff')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);
    
    const categoryRow = new ActionRowBuilder().addComponents(nameInput);
    const descriptionRow = new ActionRowBuilder().addComponents(descriptionInput);
    const emojiRow = new ActionRowBuilder().addComponents(emojiInput);
    const colorRow = new ActionRowBuilder().addComponents(colorInput);
    
    modal.addComponents(categoryRow, descriptionRow, emojiRow, colorRow);
    
    await interaction.showModal(modal);
  }
}; 
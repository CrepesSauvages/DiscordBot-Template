const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const TicketConfig = require('../../utils/Schemas/Ticket/TicketConfig');

module.exports = {
  customID: 'ticket_category_modal',
  
  async execute(interaction) {
    const categoryName = interaction.fields.getTextInputValue('categoryName');
    const categoryDescription = interaction.fields.getTextInputValue('categoryDescription');
    let categoryEmoji = interaction.fields.getTextInputValue('categoryEmoji') || '🎫';
    let categoryColor = interaction.fields.getTextInputValue('categoryColor') || '#0099ff';
    
    // Vérifier si le format de couleur est valide
    if (!categoryColor.startsWith('#') || !/^#[0-9A-F]{6}$/i.test(categoryColor)) {
      categoryColor = '#0099ff';
    }
    
    try {
      // Vérifier si la configuration existe déjà pour ce serveur
      let ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
      
      if (!ticketConfig) {
        // Créer une nouvelle configuration si elle n'existe pas
        ticketConfig = new TicketConfig({
          guildId: interaction.guild.id,
          categories: []
        });
      }
      
      // Ajouter la nouvelle catégorie
      ticketConfig.categories.push({
        name: categoryName,
        description: categoryDescription,
        emoji: categoryEmoji,
        color: categoryColor,
        supportRoles: [],
        categoryChannel: null
      });
      
      await ticketConfig.save();
      
      // Créer un embed pour afficher la catégorie ajoutée
      const embed = new EmbedBuilder()
        .setTitle('Catégorie ajoutée avec succès')
        .setDescription(`La catégorie **${categoryName}** a été ajoutée au système de tickets.`)
        .addFields(
          { name: 'Description', value: categoryDescription },
          { name: 'Emoji', value: categoryEmoji },
          { name: 'Couleur', value: categoryColor }
        )
        .setColor(categoryColor);
      
      // Créer un bouton pour ajouter une autre catégorie
      const button = new ButtonBuilder()
        .setCustomId('add_ticket_category')
        .setLabel('Ajouter une autre catégorie')
        .setStyle(ButtonStyle.Success);
      
      const row = new ActionRowBuilder().addComponents(button);
      
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de l\'ajout de la catégorie.',
        ephemeral: true
      });
    }
  }
}; 
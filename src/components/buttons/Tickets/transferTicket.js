const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const Ticket = require('../../../utils/Schemas/Ticket/Ticket');
const TicketConfig = require('../../../utils/Schemas/Ticket/TicketConfig');

module.exports = {
  customID: 'transfer_ticket',
  
  execute: async function(interaction) {
    try {
      // Vérifier si l'utilisateur a la permission de gérer les messages
      if (!interaction.member.permissions.has('ManageMessages')) {
        return interaction.reply({
          content: "Vous n'avez pas la permission de transférer des tickets.",
          ephemeral: true
        });
      }

      const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
      const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
      
      if (!ticket) {
        return interaction.reply({
          content: "Ce salon n'est pas un ticket valide.",
          ephemeral: true
        });
      }

      if (!ticketConfig || !ticketConfig.categories || ticketConfig.categories.length === 0) {
        return interaction.reply({
          content: "Aucune catégorie de ticket n'a été configurée pour ce serveur.",
          ephemeral: true
        });
      }

      // Créer les options pour le menu de sélection de catégorie
      const options = ticketConfig.categories.map(category => ({
        label: category.name,
        value: category.name,
        description: category.description.substring(0, 95), // Limiter à 95 caractères
        emoji: category.emoji || '🎫'
      }));

      // Ne pas inclure la catégorie actuelle
      const filteredOptions = options.filter(option => option.value !== ticket.category);

      if (filteredOptions.length === 0) {
        return interaction.reply({
          content: "Il n'y a pas d'autres catégories de ticket disponibles.",
          ephemeral: true
        });
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('transfer_ticket_category')
        .setPlaceholder('Sélectionner une catégorie')
        .addOptions(filteredOptions)
        .setMinValues(1)
        .setMaxValues(1);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const embed = new EmbedBuilder()
        .setTitle('Transfert de ticket')
        .setDescription(`Sélectionnez la catégorie vers laquelle vous souhaitez transférer ce ticket.\nCatégorie actuelle: **${ticket.category}**`)
        .setColor('#0099ff')
        .setFooter({ text: 'Le ticket sera déplacé vers la catégorie sélectionnée' });

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la tentative de transfert.',
        ephemeral: true
      });
    }
  }
}; 
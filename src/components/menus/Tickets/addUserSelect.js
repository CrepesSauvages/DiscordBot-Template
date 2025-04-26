const { EmbedBuilder } = require('discord.js');
const Ticket = require('../../../utils/Schemas/Ticket/Ticket');

module.exports = {
  customID: 'add_user_select',
  
  execute: async function(interaction) {
    try {
      const userId = interaction.values[0];
      const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
      
      if (!ticket) {
        return interaction.reply({
          content: "Ce salon n'est pas un ticket valide.",
          ephemeral: true
        });
      }

      // Vérifier si l'utilisateur est déjà dans le ticket
      if (ticket.participants.includes(userId)) {
        return interaction.reply({
          content: "Cet utilisateur est déjà dans le ticket.",
          ephemeral: true
        });
      }

      // Ajouter l'utilisateur au ticket
      ticket.participants.push(userId);
      await ticket.save();

      // Mettre à jour les permissions du canal
      await interaction.channel.permissionOverwrites.create(userId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });

      await interaction.reply({
        content: `L'utilisateur <@${userId}> a été ajouté au ticket.`,
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de l\'ajout de l\'utilisateur.',
        ephemeral: true
      });
    }
  }
}; 
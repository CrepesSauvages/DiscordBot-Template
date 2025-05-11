const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');
const Ticket = require('../../../utils/Schemas/Ticket/Ticket');
const TicketConfig = require('../../../utils/Schemas/Ticket/TicketConfig');

module.exports = {
  customID: 'close_ticket',
  
  execute: async function(interaction) {
    try {
      const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
      const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
      
      if (!ticket) {
        return interaction.reply({
          content: "Ce salon n'est pas un ticket valide.",
          ephemeral: true
        });
      }

      // Créer l'embed de confirmation
      const embed = new EmbedBuilder()
        .setTitle('Confirmation de fermeture')
        .setDescription('Êtes-vous sûr de vouloir fermer ce ticket ?')
        .setColor('#ff9900')
        .setFooter({ text: 'Cette action est irréversible.' });

      // Créer les boutons de confirmation
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_close_ticket')
        .setLabel('Confirmer')
        .setStyle(ButtonStyle.Danger);

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_close_ticket')
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la fermeture du ticket.',
        ephemeral: true
      });
    }
  }
}; 
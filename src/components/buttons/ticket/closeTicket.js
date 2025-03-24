const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Ticket = require('../../../utils/Schemas/Ticket/Ticket');
const TicketConfig = require('../../../utils/Schemas/Ticket/TicketConfig');

module.exports = {
  customID: 'close_ticket',
  
  async execute(interaction, client, args) {
    try {
      // Vérifier si c'est bien un ticket
      const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
      
      if (!ticket) {
        return interaction.reply({
          content: "Ce salon n'est pas un ticket valide.",
          ephemeral: true
        });
      }
      
      // Confirmer la fermeture du ticket
      const embed = new EmbedBuilder()
        .setTitle('Confirmation de fermeture')
        .setDescription('Êtes-vous sûr de vouloir fermer ce ticket ?')
        .setColor('#ff9900')
        .setFooter({ text: 'Cette action est irréversible.' });
      
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_close_ticket')
        .setLabel('Confirmer')
        .setStyle(ButtonStyle.Danger);
      
      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_close_ticket')
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Secondary);
      
      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
      
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la fermeture du ticket.',
        ephemeral: true
      });
    }
  }
}; 
const { EmbedBuilder } = require('discord.js');
const Ticket = require('../../../utils/Schemas/Ticket/Ticket');

module.exports = {
  customID: 'claim_ticket',
  
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
      
      // Ajouter le membre à la liste des participants
      if (!ticket.participants.includes(interaction.user.id)) {
        ticket.participants.push(interaction.user.id);
        await ticket.save();
      }
      
      const embed = new EmbedBuilder()
        .setTitle('Ticket pris en charge')
        .setDescription(`Ce ticket est maintenant pris en charge par ${interaction.user}.`)
        .setColor('#00ff00')
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la prise en charge du ticket.',
        ephemeral: true
      });
    }
  }
}; 
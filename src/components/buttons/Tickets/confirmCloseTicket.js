const { EmbedBuilder } = require('discord.js');
const Ticket = require('../../../utils/Schemas/Ticket/Ticket');
const TicketConfig = require('../../../utils/Schemas/Ticket/TicketConfig');

module.exports = {
  customID: 'confirm_close_ticket',
  
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
      
      // Mettre à jour le statut du ticket
      ticket.status = 'closed';
      ticket.closedAt = new Date();
      await ticket.save();
      
      const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
      
      await interaction.reply({ content: "Fermeture du ticket en cours..." });
      
      // Si un salon de logs est configuré, y envoyer un message
      if (ticketConfig && ticketConfig.logChannel) {
        const logChannel = interaction.guild.channels.cache.get(ticketConfig.logChannel);
        
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle(`Ticket #${ticket.ticketNumber} fermé`)
            .setDescription(`Le ticket a été fermé par ${interaction.user.tag}`)
            .addFields(
              { name: 'Catégorie', value: ticket.category },
              { name: 'Créé par', value: `<@${ticket.ownerId}>` },
              { name: 'Fermé le', value: new Date().toLocaleString() }
            )
            .setColor('#ff0000')
            .setTimestamp();
          
          await logChannel.send({ embeds: [logEmbed] });
        }
      }
      
      // Délai avant suppression ou archivage
      setTimeout(async () => {
        if (ticketConfig && ticketConfig.archiveCategory) {
          // Déplacer vers la catégorie d'archive si configurée
          const archiveCategory = interaction.guild.channels.cache.get(ticketConfig.archiveCategory);
          
          if (archiveCategory) {
            await interaction.channel.setParent(archiveCategory.id, { lockPermissions: false });
            await interaction.channel.send({
              content: `Ce ticket a été archivé par ${interaction.user.tag}.`
            });
          } else {
            await interaction.channel.delete();
          }
        } else {
          // Supprimer le salon si pas de catégorie d'archive
          await interaction.channel.delete();
        }
      }, 5000); // 5 secondes avant suppression/archivage
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la fermeture du ticket.',
        ephemeral: true
      });
    }
  }
}; 
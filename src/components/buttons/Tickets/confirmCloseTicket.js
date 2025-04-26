const { EmbedBuilder } = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');
const Ticket = require('../../../utils/Schemas/Ticket/Ticket');
const TicketConfig = require('../../../utils/Schemas/Ticket/TicketConfig');

module.exports = {
  customID: 'confirm_close_ticket',
  
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

      await interaction.deferReply({ ephemeral: true });

      // Créer la transcription HTML
      const transcript = await createTranscript(interaction.channel, {
        limit: -1, // Pas de limite de messages
        fileName: `ticket-${ticket.ticketNumber}.html`,
        poweredBy: false,
        saveImages: true,
        footerText: `Ticket #${ticket.ticketNumber} - ${ticket.category}`,
      });

      // Enregistrer les informations dans la base de données
      ticket.status = 'closed';
      ticket.closedAt = new Date();
      await ticket.save();

      // Envoyer la transcription dans le canal de logs si configuré
      if (ticketConfig && ticketConfig.logChannel) {
        const logChannel = interaction.guild.channels.cache.get(ticketConfig.logChannel);
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setTitle(`Transcription du ticket #${ticket.ticketNumber}`)
            .setDescription(`**Catégorie:** ${ticket.category}\n**Créé par:** <@${ticket.ownerId}>\n**Fermé par:** <@${interaction.user.id}>\n**Créé le:** ${ticket.createdAt.toLocaleString()}\n**Fermé le:** ${new Date().toLocaleString()}`)
            .setColor('#ff0000')
            .setTimestamp();

          await logChannel.send({ embeds: [embed] });
          await logChannel.send({ files: [transcript] });
        } else {
          await interaction.editReply({
            content: "⚠️ Le salon de logs n'a pas été trouvé. La transcription ne sera pas sauvegardée.",
            ephemeral: true
          });
        }
      } else {
        await interaction.editReply({
          content: "⚠️ Aucun salon de logs n'est configuré. La transcription ne sera pas sauvegardée.",
          ephemeral: true
        });
      }

      // Message de confirmation
      await interaction.editReply({
        content: "Le ticket va être fermé et une transcription a été créée. Le salon sera supprimé dans 5 secondes.",
        ephemeral: true
      });

      // Envoyer un message visible par tout le monde dans le ticket
      await interaction.channel.send({
        content: `🔒 Ce ticket a été fermé par ${interaction.user}. Le salon sera supprimé dans 5 secondes.`
      });

      // Supprimer le salon après 5 secondes
      setTimeout(async () => {
        try {
          await interaction.channel.delete();
        } catch (error) {
          console.error('Erreur lors de la suppression du salon:', error);
          await interaction.editReply({
            content: "Une erreur est survenue lors de la suppression du salon.",
            ephemeral: true
          });
        }
      }, 5000);

    } catch (error) {
      console.error(error);
      if (interaction.deferred) {
        await interaction.editReply({
          content: 'Une erreur est survenue lors de la fermeture du ticket.',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'Une erreur est survenue lors de la fermeture du ticket.',
          ephemeral: true
        });
      }
    }
  }
}; 
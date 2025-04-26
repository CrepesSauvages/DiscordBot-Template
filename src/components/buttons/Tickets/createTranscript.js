const { EmbedBuilder } = require('discord.js');
const Ticket = require('../../../utils/Schemas/Ticket/Ticket');
const TicketConfig = require('../../../utils/Schemas/Ticket/TicketConfig');

module.exports = {
  customID: 'create_transcript',
  
  execute: async function(interaction) {
    try {
      const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
      const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
      
      if (!ticket || !ticketConfig) {
        return interaction.reply({
          content: "Ce salon n'est pas un ticket valide ou la configuration est introuvable.",
          ephemeral: true
        });
      }

      // Vérifier si le canal de logs est configuré
      if (!ticketConfig.logChannel) {
        return interaction.reply({
          content: "Le canal de logs n'est pas configuré. Utilisez `/setup-tickets` pour le configurer.",
          ephemeral: true
        });
      }

      // Récupérer tous les messages du ticket
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      // Créer la transcription
      let transcript = `# Transcription du ticket #${ticket.ticketNumber}\n\n`;
      transcript += `**Catégorie:** ${ticket.category}\n`;
      transcript += `**Créé par:** <@${ticket.ownerId}>\n`;
      transcript += `**Créé le:** ${ticket.createdAt.toLocaleString()}\n\n`;
      transcript += `## Messages:\n\n`;

      for (const message of sortedMessages.values()) {
        if (message.author.bot) continue;
        
        transcript += `**${message.author.tag}** (${message.createdAt.toLocaleString()}):\n`;
        transcript += `${message.content}\n\n`;
      }

      // Enregistrer la transcription dans la base de données
      ticket.transcript = transcript;
      await ticket.save();

      // Envoyer la transcription dans le canal de logs
      const logChannel = interaction.guild.channels.cache.get(ticketConfig.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle(`Transcription du ticket #${ticket.ticketNumber}`)
          .setDescription(`Catégorie: ${ticket.category}\nCréé par: <@${ticket.ownerId}>`)
          .setColor('#0099ff')
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
        await logChannel.send({ content: transcript });
      }

      await interaction.reply({
        content: "La transcription a été créée et envoyée dans le canal de logs.",
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la création de la transcription.',
        ephemeral: true
      });
    }
  }
}; 
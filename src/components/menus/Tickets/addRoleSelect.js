const { EmbedBuilder } = require('discord.js');
const Ticket = require('../../../utils/Schemas/Ticket/Ticket');

module.exports = {
  customID: 'add_role_select',
  
  execute: async function(interaction) {
    try {
      const roleId = interaction.values[0];
      const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
      
      if (!ticket) {
        return interaction.reply({
          content: "Ce salon n'est pas un ticket valide.",
          ephemeral: true
        });
      }

      // Vérifier si le rôle a déjà accès
      const currentPerms = interaction.channel.permissionOverwrites.cache.get(roleId);
      if (currentPerms && currentPerms.allow.has('ViewChannel')) {
        return interaction.reply({
          content: "Ce rôle a déjà accès au ticket.",
          ephemeral: true
        });
      }

      // Mettre à jour les permissions du canal
      await interaction.channel.permissionOverwrites.create(roleId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });

      const role = interaction.guild.roles.cache.get(roleId);
      await interaction.reply({
        content: `Le rôle ${role.name} a été ajouté au ticket.`,
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de l\'ajout du rôle.',
        ephemeral: true
      });
    }
  }
}; 
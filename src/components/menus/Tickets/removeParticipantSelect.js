const { EmbedBuilder } = require('discord.js');
const Ticket = require('../../../utils/Schemas/Ticket/Ticket');

module.exports = {
  customID: 'remove_participant_select',
  
  execute: async function(interaction) {
    try {
      const selectedId = interaction.values[0];
      const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
      
      if (!ticket) {
        return interaction.reply({
          content: "Ce salon n'est pas un ticket valide.",
          ephemeral: true
        });
      }

      // Vérifier si c'est un rôle ou un utilisateur
      if (selectedId.startsWith('role_')) {
        const roleId = selectedId.replace('role_', '');
        await interaction.channel.permissionOverwrites.delete(roleId);
        
        const role = interaction.guild.roles.cache.get(roleId);
        await interaction.reply({
          content: `Le rôle ${role.name} a été retiré du ticket.`,
          ephemeral: true
        });
      } else {
        // C'est un utilisateur
        if (selectedId === ticket.ownerId) {
          return interaction.reply({
            content: "Vous ne pouvez pas retirer le propriétaire du ticket.",
            ephemeral: true
          });
        }

        // Retirer l'utilisateur du ticket
        ticket.participants = ticket.participants.filter(id => id !== selectedId);
        await ticket.save();

        // Mettre à jour les permissions du canal
        await interaction.channel.permissionOverwrites.delete(selectedId);

        await interaction.reply({
          content: `L'utilisateur <@${selectedId}> a été retiré du ticket.`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors du retrait du participant.',
        ephemeral: true
      });
    }
  }
}; 
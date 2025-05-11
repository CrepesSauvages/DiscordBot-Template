const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, UserSelectMenuBuilder, RoleSelectMenuBuilder } = require('discord.js');
const Ticket = require('../../../utils/Schemas/Ticket/Ticket');

module.exports = {
  customID: 'ticket_management',
  
  execute: async function(interaction, client) {
    try {
      const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
      if (!ticket) {
        return interaction.reply({
          content: "Ce salon n'est pas un ticket valide.",
          ephemeral: true
        });
      }

      // Menu de sélection d'utilisateur
      const userSelect = new UserSelectMenuBuilder()
        .setCustomId('add_user_select')
        .setPlaceholder('Ajouter un utilisateur')
        .setMinValues(0)
        .setMaxValues(1);

      // Menu de sélection de rôle
      const roleSelect = new RoleSelectMenuBuilder()
        .setCustomId('add_role_select')
        .setPlaceholder('Ajouter un rôle')
        .setMinValues(0)
        .setMaxValues(1);

      // Créer les composants de base
      const components = [
        new ActionRowBuilder().addComponents(userSelect),
        new ActionRowBuilder().addComponents(roleSelect)
      ];

      // Récupérer les participants pour le menu de retrait
      const participantOptions = [];
      
      // Ajouter les utilisateurs
      for (const participantId of ticket.participants) {
        if (participantId !== ticket.ownerId) {
          try {
            const member = await interaction.guild.members.fetch(participantId);
            participantOptions.push({
              label: member.user.username,
              value: participantId,
              description: `Utilisateur`,
            });
          } catch (error) {
            console.error(`Impossible de récupérer le membre ${participantId}:`, error);
          }
        }
      }

      // Ajouter les rôles
      const roleOverwrites = interaction.channel.permissionOverwrites.cache.filter(p => p.type === 0);
      for (const [id, overwrite] of roleOverwrites) {
        if (id !== interaction.guild.id) {
          const role = interaction.guild.roles.cache.get(id);
          if (role) {
            participantOptions.push({
              label: role.name,
              value: `role_${id}`,
              description: `Rôle`,
            });
          }
        }
      }

      // Ajouter le menu de retrait seulement s'il y a des participants à retirer
      if (participantOptions.length > 0) {
        const removeSelect = new StringSelectMenuBuilder()
          .setCustomId('remove_participant_select')
          .setPlaceholder('Retirer un participant')
          .setMinValues(0)
          .setMaxValues(1)
          .addOptions(participantOptions.slice(0, 25)); // Limite de 25 options

        components.push(new ActionRowBuilder().addComponents(removeSelect));
      }

      // Ajouter le bouton de transcription
      const transcriptButton = new ButtonBuilder()
        .setCustomId('create_transcript')
        .setLabel('Créer une transcription')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝');

      components.push(new ActionRowBuilder().addComponents(transcriptButton));

      await interaction.reply({
        content: "Gérer les participants du ticket :",
        components: components,
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la gestion du ticket.',
        ephemeral: true
      });
    }
  }
}; 
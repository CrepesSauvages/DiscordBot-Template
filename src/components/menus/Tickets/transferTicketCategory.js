const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Ticket = require('../../../../utils/Schemas/Ticket/Ticket');
const TicketConfig = require('../../../../utils/Schemas/Ticket/TicketConfig');

module.exports = {
  customID: 'transfer_ticket_category',
  
  execute: async function(interaction) {
    try {
      // Vérifier si l'utilisateur a la permission de gérer les messages
      if (!interaction.member.permissions.has('ManageMessages')) {
        return interaction.reply({
          content: "Vous n'avez pas la permission de transférer des tickets.",
          ephemeral: true
        });
      }

      const categoryName = interaction.values[0];
      const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
      const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
      
      if (!ticket) {
        return interaction.reply({
          content: "Ce salon n'est pas un ticket valide.",
          ephemeral: true
        });
      }

      // Récupérer l'ancienne catégorie
      const oldCategoryName = ticket.category;
      
      // Trouver la nouvelle catégorie
      const newCategory = ticketConfig.categories.find(cat => cat.name === categoryName);
      if (!newCategory) {
        return interaction.reply({
          content: "Catégorie introuvable.",
          ephemeral: true
        });
      }

      // Stocker la catégorie parentale (Discord)
      const newParentId = newCategory.categoryChannel;
      
      // Mettre à jour la catégorie du ticket dans la base de données
      ticket.category = categoryName;
      await ticket.save();

      // Mettre à jour le nom du ticket
      const ticketNumber = ticket.ticketNumber;
      const owner = await interaction.guild.members.fetch(ticket.ownerId).catch(() => null);
      const ownerName = owner ? owner.user.username : 'unknown';
      const newChannelName = `ticket-${ticketNumber}-${ownerName}`;
      
      // Mettre à jour le channel
      await interaction.channel.setName(newChannelName);
      
      // Si un nouveau parent est défini, déplacer le ticket vers cette catégorie
      if (newParentId) {
        await interaction.channel.setParent(newParentId, {
          lockPermissions: false // Ne pas synchroniser les permissions avec le parent
        });
      }

      // Mettre à jour les permissions du ticket avec les nouveaux rôles de support
      if (newCategory.supportRoles && newCategory.supportRoles.length > 0) {
        // Réinitialiser d'abord les permissions pour les rôles de support
        const currentOverwrites = interaction.channel.permissionOverwrites.cache;
        
        // Conserver uniquement les permissions de l'utilisateur et du serveur
        const permissionsToKeep = [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: ticket.ownerId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
        ];
        
        // Ajouter les permissions pour les participants
        for (const participantId of ticket.participants) {
          if (participantId !== ticket.ownerId) {
            permissionsToKeep.push({
              id: participantId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            });
          }
        }
        
        // Appliquer les nouvelles permissions de base
        await interaction.channel.permissionOverwrites.set(permissionsToKeep);
        
        // Ajouter les permissions pour les nouveaux rôles de support
        for (const roleId of newCategory.supportRoles) {
          await interaction.channel.permissionOverwrites.create(roleId, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
          });
        }
      }

      // Créer un embed pour notifier le transfert
      const embed = new EmbedBuilder()
        .setTitle('Ticket transféré')
        .setDescription(`Ce ticket a été transféré de la catégorie **${oldCategoryName}** vers **${categoryName}** par ${interaction.user}.`)
        .setColor(newCategory.color || '#0099ff')
        .setTimestamp();

      // Envoyer la notification dans le canal
      await interaction.channel.send({ embeds: [embed] });

      // Notifier l'utilisateur
      await interaction.reply({
        content: `Le ticket a été transféré vers la catégorie **${categoryName}**.`,
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors du transfert du ticket.',
        ephemeral: true
      });
    }
  }
}; 
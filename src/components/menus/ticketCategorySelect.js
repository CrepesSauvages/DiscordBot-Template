const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const TicketConfig = require('../../utils/Schemas/Ticket/TicketConfig');
const Ticket = require('../../utils/Schemas/Ticket/Ticket');

module.exports = {
  customID: 'ticket_category_select',
  
  execute: async function(interaction, client) {
    try {
      const categoryName = interaction.values[0];
      const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
      
      if (!ticketConfig) {
        return interaction.reply({
          content: "La configuration des tickets est introuvable.",
          ephemeral: true
        });
      }
      
      // Trouver la catégorie sélectionnée
      const selectedCategory = ticketConfig.categories.find(cat => cat.name === categoryName);
      
      if (!selectedCategory) {
        return interaction.reply({
          content: "Catégorie introuvable.",
          ephemeral: true
        });
      }
      
      // Incrémenter le compteur de tickets
      ticketConfig.ticketCounter += 1;
      await ticketConfig.save();
      
      const ticketNumber = ticketConfig.ticketCounter;
      
      // Vérifier si une catégorie est assignée à ce type de ticket
      let parentId = null;
      if (selectedCategory.categoryChannel) {
        // Vérifier si la catégorie existe
        const categoryChannel = interaction.guild.channels.cache.get(selectedCategory.categoryChannel);
        if (categoryChannel) {
          parentId = categoryChannel.id;
        } else {
          // Informer que la catégorie configurée n'existe plus
          await interaction.reply({
            content: "La catégorie configurée pour ce type de ticket n'existe plus. Veuillez contacter un administrateur.",
            ephemeral: true
          });
          return;
        }
      }
      
      // Options de création du salon
      const channelOptions = {
        name: `ticket-${ticketNumber}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
        ]
      };
      
      // Ajouter le parent seulement s'il est défini
      if (parentId) {
        channelOptions.parent = parentId;
      }
      
      // Créer le salon de ticket
      const channel = await interaction.guild.channels.create(channelOptions);
      
      // Ajouter les permissions pour les rôles de support
      if (selectedCategory.supportRoles && selectedCategory.supportRoles.length > 0) {
        for (const roleId of selectedCategory.supportRoles) {
          await channel.permissionOverwrites.create(roleId, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
          });
        }
      }
      
      // Créer un nouveau ticket dans la base de données
      const newTicket = new Ticket({
        guildId: interaction.guild.id,
        channelId: channel.id,
        ticketNumber: ticketNumber,
        category: categoryName,
        ownerId: interaction.user.id,
        participants: [interaction.user.id]
      });
      
      await newTicket.save();
      
      // Créer l'embed de bienvenue
      const embed = new EmbedBuilder()
        .setTitle(`Ticket #${ticketNumber} - ${categoryName}`)
        .setDescription(ticketConfig.welcomeMessage || "Merci d'avoir ouvert un ticket. Un membre de notre équipe vous répondra bientôt.")
        .addFields(
          { name: 'Créé par', value: `<@${interaction.user.id}>` },
          { name: 'Catégorie', value: categoryName },
          { name: 'Description', value: selectedCategory.description }
        )
        .setColor(selectedCategory.color || '#0099ff')
        .setTimestamp();
      
      // Boutons de gestion du ticket
      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Fermer le ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒');
      
      const claimButton = new ButtonBuilder()
        .setCustomId('claim_ticket')
        .setLabel('Prendre en charge')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🙋');
      
      const manageButton = new ButtonBuilder()
        .setCustomId('ticket_management')
        .setLabel('Gérer le ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⚙️');
      
      const row = new ActionRowBuilder().addComponents(closeButton, claimButton, manageButton);
      
      await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
      
      await interaction.reply({
        content: `Votre ticket a été créé : <#${channel.id}>`,
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la création du ticket.',
        ephemeral: true
      });
    }
  }
};
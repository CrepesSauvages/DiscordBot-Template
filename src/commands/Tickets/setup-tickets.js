const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, StringSelectMenuBuilder, ChannelSelectMenuBuilder } = require('discord.js');
const TicketConfig = require('../../utils/Schemas/Ticket/TicketConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Configure le système de tickets pour votre serveur')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Crée le panneau de tickets principal')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Le salon où envoyer le panneau de tickets')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Titre du panneau de tickets')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Description du panneau de tickets')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('logs')
        .setDescription('Configure le salon des logs de tickets')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Le salon où envoyer les transcriptions')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('manage')
        .setDescription('Gère les catégories de tickets')
        .addStringOption(option =>
          option.setName('action')
            .setDescription('Action à effectuer')
            .setRequired(true)
            .addChoices(
              { name: 'Ajouter une catégorie', value: 'add' },
              { name: 'Modifier une catégorie', value: 'edit' },
              { name: 'Supprimer une catégorie', value: 'delete' },
              { name: 'Voir les catégories', value: 'view' },
              { name: 'Définir la catégorie parente', value: 'setparent' }
            )))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'logs') {
      const channel = interaction.options.getChannel('channel');
      
      // Vérifier si le bot a les permissions nécessaires
      const permissions = channel.permissionsFor(interaction.client.user);
      if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.ViewChannel)) {
        return interaction.reply({
          content: "Je n'ai pas les permissions nécessaires dans ce salon. J'ai besoin des permissions de voir le salon et d'envoyer des messages.",
          ephemeral: true
        });
      }

      // Mettre à jour la configuration
      let config = await TicketConfig.findOne({ guildId: interaction.guild.id });
      if (!config) {
        config = new TicketConfig({ guildId: interaction.guild.id });
      }

      config.logChannel = channel.id;
      await config.save();

      return interaction.reply({
        content: `Le salon ${channel} a été configuré comme salon de logs pour les tickets.`,
        ephemeral: true
      });
    }

    if (subcommand === 'create') {
      const channel = interaction.options.getChannel('channel');
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      
      // Vérifier si le serveur a des catégories configurées
      let ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
      
      if (!ticketConfig || ticketConfig.categories.length === 0) {
        return interaction.reply({
          content: "Vous devez d'abord configurer des catégories de tickets avec `/setup-tickets manage`.",
          ephemeral: true
        });
      }
      
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor('#0099ff')
        .setFooter({ text: 'Sélectionnez une catégorie et cliquez sur le bouton pour ouvrir un ticket' });
      
      const button = new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Créer un ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫');
      
      const row = new ActionRowBuilder().addComponents(button);
      
      await channel.send({ embeds: [embed], components: [row] });
      
      await interaction.reply({
        content: `Le panneau de tickets a été créé dans ${channel}.`,
        ephemeral: true
      });
    } 
    else if (subcommand === 'manage') {
      const action = interaction.options.getString('action');
      
      if (action === 'add') {
        // Envoyer un message avec un bouton pour ouvrir le modal
        const embed = new EmbedBuilder()
          .setTitle('Gestion des catégories de tickets')
          .setDescription('Cliquez sur le bouton ci-dessous pour ajouter une nouvelle catégorie de tickets.')
          .setColor('#0099ff');
        
        const button = new ButtonBuilder()
          .setCustomId('add_ticket_category')
          .setLabel('Ajouter une catégorie')
          .setStyle(ButtonStyle.Success);
        
        const row = new ActionRowBuilder().addComponents(button);
        
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      } 
      else if (action === 'view') {
        // Afficher les catégories existantes
        let ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
        
        if (!ticketConfig || ticketConfig.categories.length === 0) {
          return interaction.reply({
            content: "Aucune catégorie n'a été configurée pour ce serveur.",
            ephemeral: true
          });
        }
        
        const embed = new EmbedBuilder()
          .setTitle('Catégories de tickets configurées')
          .setColor('#0099ff');
          
        ticketConfig.categories.forEach((category, index) => {
          embed.addFields({
            name: `${index + 1}. ${category.name}`,
            value: `Description: ${category.description}\nCatégorie: ${category.categoryChannel ? `<#${category.categoryChannel}>` : 'Non définie'}\nÉquipe assignée: ${category.supportRoles.map(role => `<@&${role}>`).join(', ') || 'Aucune'}`
          });
        });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
      else if (action === 'delete') {
        // Logique pour supprimer une catégorie
        let ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
        
        if (!ticketConfig || ticketConfig.categories.length === 0) {
          return interaction.reply({
            content: "Aucune catégorie n'a été configurée pour ce serveur.",
            ephemeral: true
          });
        }
        
        const options = ticketConfig.categories.map((category, index) => {
          return {
            label: category.name,
            value: index.toString(),
            description: category.description.substring(0, 100)
          };
        });
        
        // À implémenter plus tard
        await interaction.reply({ 
          content: "Fonctionnalité de suppression à implémenter prochainement.", 
          ephemeral: true 
        });
      }
      else if (action === 'setparent') {
        // Récupérer les catégories existantes
        let ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
        
        if (!ticketConfig || ticketConfig.categories.length === 0) {
          return interaction.reply({
            content: "Aucune catégorie n'a été configurée pour ce serveur.",
            ephemeral: true
          });
        }
        
        // Créer un menu de sélection pour choisir la catégorie de ticket
        const ticketCategorySelect = new StringSelectMenuBuilder()
          .setCustomId('select_ticket_category_for_parent')
          .setPlaceholder('Choisir une catégorie de ticket')
          .addOptions(
            ticketConfig.categories.map((category, index) => ({
              label: category.name,
              description: category.description.substring(0, 100),
              value: index.toString()
            }))
          );
        
        const row1 = new ActionRowBuilder().addComponents(ticketCategorySelect);
        
        // Créer un menu de sélection pour choisir la catégorie Discord
        const discordCategorySelect = new ChannelSelectMenuBuilder()
          .setCustomId('select_discord_category')
          .setPlaceholder('Choisir une catégorie Discord')
          .setChannelTypes(ChannelType.GuildCategory);
        
        const row2 = new ActionRowBuilder().addComponents(discordCategorySelect);
        
        await interaction.reply({ 
          content: "Veuillez sélectionner d'abord une catégorie de ticket, puis une catégorie Discord dans laquelle les tickets de ce type seront créés.",
          components: [row1, row2],
          ephemeral: true 
        });
      }
    }
  }
}; 
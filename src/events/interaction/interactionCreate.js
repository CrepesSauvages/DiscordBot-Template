const CheckGuildAccess = require('../../utils/Checker/GuildAccess');
const CheckUserAccess = require('../../utils/Checker/UserAccess');
const CheckPermissions = require('../../utils/Checker/Permissions');
const CheckCooldown = require('../../utils/Checker/Cooldown');
const Collector = require('../../utils/Overrides/Collector');

function createCollector() {
	return new Collector(this.client, this);
}

module.exports = {
	name: 'interactionCreate',
	execute: async function (client, interaction) {

		Object.assign(interaction, { createCollector });

		const BoundHandler = InteractionHandler.bind(null, client, interaction);

		switch (interaction.type) {
			case 4: // Autocomplete
			case 2: // Slash Commands
				let commandName = interaction.commandName;
				
				// Vérification des commandes temporaires
				command = client.commands.get(commandName);
				if (client.tempCommands.tempCommands.has(commandName)) {
					const tempCommand = client.tempCommands.tempCommands.get(commandName);
					if (Date.now() > tempCommand.expiresAt) {
						client.tempCommands.delete(commandName);
						throw ['Cette commande temporaire a expiré', 'Expired command'];
					}
					command = tempCommand.data;
				}

				if (!command) throw ['Commande non trouvée', 'Command not found'];

				const subcommand = interaction.options._subcommand ?? "";
				const subcommandGroup = interaction.options._subcommandGroup ?? "";
				const commandArgs = interaction.options._hoistedOptions ?? [];
				const args = `${subcommandGroup} ${subcommand} ${commandArgs.map(arg => arg.value).join(" ")}`.trim();
				client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > /${interaction.commandName} ${args}`);
				await BoundHandler('commands');
				break;
			case 3: // Message Components
				if (interaction.isButton()) {
					client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > [${interaction.customId}]`);
					await BoundHandler('buttons');
				} else if (interaction.isAnySelectMenu()) {
					client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > <${interaction.customId}>`);
					await BoundHandler('menus');
				}
				break;
			case 5: // Modal submit
				client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > {${interaction.customId}}`);
				await BoundHandler('modals');
				break;
			default:
				client.logs.warn(`Unknown interaction type: ${interaction.type}`);
				client.logs.warn('Unsure how to handle this...');
				break;
		}
	}
}

async function InteractionHandler(client, interaction, type) {
	// Récupérer le customId complet (commandName pour les slash commands)
	const fullCustomId = interaction.customId || interaction.commandName;
	
	// Traiter les customIDs dynamiques avec paramètres
	// Format supporté:
	// 1. base-arg1-arg2 (format habituel avec tirets)
	// 2. base#param1#param2 (nouveau format avec # comme séparateur de paramètres)
	
	let baseId, args, params;
	
	if (fullCustomId.includes('#')) {
		// Nouveau format avec # comme séparateur
		[baseId, ...params] = fullCustomId.split('#');
		args = []; // Pas d'args dans ce format, seulement des params
	} else {
		// Format traditionnel avec tirets
		args = fullCustomId.split('-');
		baseId = args.shift();
		params = []; // Pas de params dans ce format
	}
	
	// Stocker les paramètres dans l'interaction pour y accéder facilement
	interaction.params = params;
	
	// Chercher le composant par son ID de base
	let component = client[type].get(baseId);
	
	// Gestion des noms de composants dynamiques (comme 'use_template_category')
	if (!component && type === 'menus') {
		// Chercher un handler qui correspond au pattern du customId
		for (const [handlerId, handler] of client[type].entries()) {
			// Cas 1: Le handler a une méthode customID qui est une fonction
			if (typeof handler.customID === 'function' && handler.customID(fullCustomId)) {
				component = handler;
				break;
			}
			
			// Cas 2: Le customId commence par le nom du handler suivi d'un underscore
			// Exemple: "use_template_Général" correspondrait au handler "use_template"
			if (fullCustomId.startsWith(`${handlerId}_`)) {
				// Extraire la partie après le underscore comme paramètre
				const dynamicPart = fullCustomId.substring(handlerId.length + 1);
				if (!interaction.params) interaction.params = [];
				interaction.params.push(dynamicPart);
				component = handler;
				break;
			}
		}
	}
	
	if (!component) {
		await interaction.reply({
			content: `There was an error while executing this command!\n\`\`\`Command not found\`\`\``,
			ephemeral: true
		}).catch(() => { });
		client.logs.error(`${type} not found: ${fullCustomId}`);
		return;
	}

	try {
		CheckGuildAccess(component.guilds, interaction.guildId);
		CheckUserAccess(component.roles, component.users, interaction.member, interaction.user);
		if (!interaction.isAutocomplete()) {
			CheckCooldown(client, interaction.user.id, component.customID ?? fullCustomId, component.cooldown);
		}

		const botMember = interaction.guild?.members.cache.get(client.user.id) ?? await interaction.guild?.members.fetch(client.user.id).catch(() => null);
		if (botMember !== null) {
			// This code will only trigger if
			// 1) Bot is in the guild (always will)
			// 2) Command not being run in DMs
			// 3) Client has GuildMembers intent
			// 4) Not actively rate limited
			CheckPermissions(component.clientPerms, botMember); // bot
			CheckPermissions(component.userPerms, interaction.member); // user
		}
	} catch ([response, reason]) {
		await interaction.reply({
			content: response,
			ephemeral: true
		}).catch(() => { });
		client.logs.error(`Blocked user from ${type}: ${reason}`);
		return;
	}

	try {
		if (interaction.isAutocomplete()) {
			await component.autocomplete(interaction, client, type === 'commands' ? undefined : args);
		} else {
			await component.execute(interaction, client, type === 'commands' ? undefined : args);
		}
	} catch (error) {
		client.logs.error(error.stack);
		await interaction.deferReply({ ephemeral: true }).catch(() => { });
		await interaction.editReply({
			content: `There was an error while executing this command!\n\`\`\`${error}\`\`\``,
			embeds: [],
			components: [],
			files: [],
			ephemeral: true
		}).catch(() => {});
	}
}

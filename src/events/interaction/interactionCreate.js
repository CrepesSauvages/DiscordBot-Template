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
		const userTag = `${interaction.user.tag} (${interaction.user.id})`;

		try {
			switch (interaction.type) {
				case 4: // Autocomplete
				case 2: // Slash Commands
					await handleCommandInteraction(client, interaction, BoundHandler, userTag);
					break;
				case 3: // Message Components (boutons, menus)
					await handleComponentInteraction(client, interaction, BoundHandler, userTag);
					break;
				case 5: // Modal submit
					client.logs.info(`${userTag} > {${interaction.customId}}`);
					await BoundHandler('modals');
					break;
				default:
					client.logs.warn(`Unknown interaction type: ${interaction.type}`);
					break;
			}
		} catch (error) {
			client.logs.error(`Error processing interaction: ${error.stack}`);
		}
	}
};

async function handleCommandInteraction(client, interaction, BoundHandler, userTag) {
	const subcommand = interaction.options._subcommand ?? "";
	const subcommandGroup = interaction.options._subcommandGroup ?? "";
	const commandArgs = interaction.options._hoistedOptions ?? [];
	const args = `${subcommandGroup} ${subcommand} ${commandArgs.map(arg => arg.value).join(" ")}`.trim();

	client.logs.info(`${userTag} > /${interaction.commandName} ${args}`);
	await BoundHandler('commands');
}

async function handleComponentInteraction(client, interaction, BoundHandler, userTag) {
	if (interaction.isButton()) {
		client.logs.info(`${userTag} > [${interaction.customId}]`);
		await BoundHandler('buttons');
	} else if (interaction.isAnySelectMenu()) {
		client.logs.info(`${userTag} > <${interaction.customId}>`);
		await BoundHandler('menus');
	}
}

async function InteractionHandler(client, interaction, type) {
	const args = interaction.customId?.split("_") ?? [];
	const name = args.shift();

	const component = client[type].get(name ?? interaction.commandName);
	if (!component) {
		await safeReply(interaction, "Commande non trouvée.");
		client.logs.error(`${type} not found: ${interaction.customId}`);
		return;
	}

	try {
		await checkPermissions(client, interaction, component);
		await executeComponent(client, interaction, component, type, args);
	} catch (error) {
		client.logs.error(error.stack);
		await safeReply(interaction, `Erreur lors de l'exécution !\n\`\`\`${error.message}\`\`\``);
	}
}

async function checkPermissions(client, interaction, component) {
	CheckGuildAccess(component.guilds, interaction.guildId);
	CheckUserAccess(component.roles, component.users, interaction.member, interaction.user);
	CheckCooldown(client, interaction.user.id, component.customID ?? interaction.commandName, component.cooldown);

	const botMember = interaction.guild?.members.cache.get(client.user.id) ?? await interaction.guild?.members.fetch(client.user.id).catch(() => null);
	if (botMember !== null) {
		CheckPermissions(component.clientPerms, botMember, client); // bot
		CheckPermissions(component.userPerms, interaction.member, client); // user
	}
}

async function executeComponent(client, interaction, component, type, args) {
	if (interaction.isAutocomplete()) {
		await component.autocomplete(interaction, client, type === 'commands' ? undefined : args);
	} else {
		await component.execute(interaction, client, type === 'commands' ? undefined : args);
	}
}

async function safeReply(interaction, message) {
	try {
		await interaction.deferReply({ ephemeral: true });
		await interaction.editReply({ content: message, embeds: [], components: [], files: [], ephemeral: true });
	} catch (e) {
		// Ignore les erreurs si le message ne peut pas être envoyé
	}
}
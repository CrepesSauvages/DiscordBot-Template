const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pong!'),
		/**
		 * 
		 * @param {ChatInputCommandInteraction} interaction 
		 * @param {import("../../../index")} client 
		 */
	autocomplete: async function(interaction, client) {
		// this is optional, called on any autocomplete stuff
	},
	execute: async function(interaction, client) {
		const locale = await client.locales.getGuildLocale(interaction.guildId);
		const response = client.locales.translate('commands.ping.responses.pong', locale, {
			ms: client.ws.ping
		});

		
		await interaction.reply({ content: response, ephemeral: true });
	}
}

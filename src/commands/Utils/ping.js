const { SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");

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
		await interaction.reply({ content: 'Pong again!', hidden:true});;
	}
}

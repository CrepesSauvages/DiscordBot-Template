const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	dev: false, // hide from all guilds except from config.json
	guilds: ['1197542985601138708'], // guild whitelist via ID
	roles: ['1199739724156391504'], // required to have one of the listed role IDs
	users: ['562667788645171201'], // user whitelist via ID
	cooldown: 5, // cooldown in seconds
	userPerms: ['ManageGuild'], // required user permissions
	clientPerms: ['Administrator'], // required bot permissions
	data: new SlashCommandBuilder()
		.setName('restricted')
		.setDescription('A restricted command')
		.addStringOption(x => x
			.setName('input')
			.setDescription('The input to echo back')
			.setRequired(true)
		),
	async execute(interaction) {
		const input = interaction.options.getString('input');
		await interaction.reply(`You provided: ${input}`);
	},
};
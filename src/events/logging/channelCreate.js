module.exports = {
    name: 'channelCreate',
    async execute(client, channel) {
        if (!channel.guild) return;
        await client.logManager.logChannelCreate(channel);
    }
};
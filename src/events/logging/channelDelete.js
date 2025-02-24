module.exports = {
    name: 'channelDelete',
    async execute(client, channel) {
        if (!channel.guild) return;
        await client.logManager.logChannelDelete(channel);
    }
};
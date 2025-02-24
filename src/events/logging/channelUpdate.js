module.exports = {
    name: 'channelUpdate',
    async execute(client, oldChannel, newChannel) {
        if (!oldChannel.guild) return;
        await client.logManager.logChannelUpdate(oldChannel, newChannel);
    }
};
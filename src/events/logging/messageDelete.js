module.exports = {
    name: 'messageDelete',
    async execute(client, message) {
        if (!message.guild || message.author?.bot) return;
        await client.logManager.logMessageDelete(message);
    }
};
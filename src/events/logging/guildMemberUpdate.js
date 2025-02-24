module.exports = {
    name: 'guildMemberUpdate',
    async execute(client, oldMember, newMember) {
        if (oldMember.bot) return;
        await client.logManager.logMemberUpdate(oldMember, newMember);
    }
};
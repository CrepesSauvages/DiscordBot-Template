const { Client } = require("discord.js")


module.exports = {
    name: 'ready',
    /**
     * 
     * @param {import('../../../index')} client 
     */
    execute: async function (client) {
        client.logs.custom(`🟢 ${client.user.tag} est prêt !`, 0x7946ff);
        if (client.config.activity.dynamic) {
            const activities = client.config.activity.choices.sort((a, b) => a.order - b.order);
            setInterval(() => {
                const currentActivity = activities.shift();
                client.user.setPresence({
                    activities: [
                        {
                            name: currentActivity.name,
                            type: currentActivity.type,
                        },
                    ],
                    status: 'online',
                });
                activities.push(currentActivity);
            }, client.config.activity.interval);
        } else {
            const defaultActivity = client.config.activity.choices.sort((a, b) => a.order - b.order)[0];
            client.user.setPresence({
                activities: [
                    {
                        name: defaultActivity.name,
                        type: defaultActivity.type,
                    },
                ],
                status: 'online',
            });
        }
    }
}
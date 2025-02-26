const { ActivityType } = require("discord.js"); // Ajoute cette importation
const ModerationService = require("../../utils/System/Modération/ModerationService");

module.exports = {
    name: 'ready',
    execute: async function (client) {
        client.logs.custom(`🟢 ${client.user.tag} est prêt !`, 0x7946ff);
        client.moderationService = new ModerationService(client);
        client.moderationService.start();

        if (client.config.activity.dynamic) {
            const activities = client.config.activity.choices.sort((a, b) => a.order - b.order);

            setInterval(() => {
                const currentActivity = activities.shift();
                client.user.setPresence({
                    activities: [
                        {
                            name: currentActivity.name,
                            type: ActivityType[currentActivity.type.toUpperCase()] || ActivityType.Playing,
                        },
                    ],
                    status: currentActivity.status || 'online',
                });
                activities.push(currentActivity);
            }, client.config.activity.interval);
        } else {
            const defaultActivity = client.config.activity.choices.sort((a, b) => a.order - b.order)[0];
            client.user.setPresence({
                activities: [
                    {
                        name: defaultActivity.name,
                        type: ActivityType[defaultActivity.type.toUpperCase()] || ActivityType.Playing,
                    },
                ],
                status: defaultActivity.status || 'online',
            });
        }
    }
}

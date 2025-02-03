const { Client, PermissionFlagsBits, Partials } = require('discord.js');
const {
    Channel,
    GuildMember,
    GuildScheduledEvent,
    Message,
    Reaction,
    ThreadMember,
    User,
} = Partials;

const client = new Client({
    intents: 53608447, // Full intents
    partials: [
        Channel,
        GuildMember,
        GuildScheduledEvent,
        Message,
        Reaction,
        ThreadMember,
        User,
    ], // Partial types
    allowedMentions: {
        parse: ["everyone", "roles", "users"],
        repliedUser: true,
    }, // Allowed mentions
    shards: 'auto'  // Shard
})

// Module 

require("./src/utils/Init/ProcessHandling.js")();

client.config = require('./src/config/main.json')
client.cooldowns = new Map();
client.logs = require("./src/utils/logs.js");

client.logs.info("Starting bot...");
client.login(client.config.token).then(() => {
    client.logs.success("Bot started successfully!");
}).catch((err) => {
    client.logs.error(err);
});
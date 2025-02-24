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
 
const { AdvancedDatabase } = require('./src/utils/DataBase/DataBase.js'); 
const TempCommandManager = require('./src/utils/TempCommands');
const AliasManager = require('./src/utils/AliasManager');
const CustomEventManager = require('./src/utils/CustomEvents');
const LocaleManager = require('./src/utils/LocaleManager');
const BackupManager = require('./src/utils/BackupManager.js')
const DashboardServer = require('./src/dashboard/server');
const LogManager = require('./src/utils/LogManager');

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

// Variables
client.config = require('./src/config/main.json')
client.cooldowns = new Map();
client.logs = require("./src/utils/logs.js");
client.commands = new Map();
client.activeCollectors = new Map();
client.database = new AdvancedDatabase(client.config.database.mongodb.uri, client.logs);
client.tempCommands = new TempCommandManager(client);
client.aliases = new AliasManager(client);
client.customEvents = new CustomEventManager(client);
client.locales = new LocaleManager(client);
client.backupManager = new BackupManager(client);
client.logManager = new LogManager(client);

// [ Modules ] 
require("./src/utils/Overrides/InteractionOverrides.js")();

//[ Init ]
//require("./src/utils/Init/CheckPackages.js")();
require("./src/utils/Init/ProcessHandling.js")();
require("./src/utils/Init/CheckIntents.js")(client);


// [ Handlers ]
require('./src/utils/Handlers/ComponentLoader.js')(client);


// [ Handlers ]
require('./src/utils/Handlers/ComponentLoader.js')(client);
require("./src/utils/Handlers/EvenementLoaders.js")(client);
require('./src/utils/Handlers/RegistreCommands.js')(client);


client.logs.info("Starting bot...");
client.login(client.config.token).then(() => {
    client.logs.success("Bot started successfully!");
    
    // Initialiser le dashboard après la connexion du bot
    try {
        const dashboard = new DashboardServer(client);
        client.dashboard = dashboard; // Garder une référence au dashboard
        dashboard.start();
    } catch (error) {
        client.logs.error("Erreur lors du démarrage du dashboard:", error);
    }
    
    client.setMaxListeners(200);
}).catch((err) => {
    client.logs.error(err);
});

module.exports = client;

// Après avoir initialisé votre client Discord

class AliasManager {
    constructor(client) {
        this.client = client;
        this.aliases = new Map();
    }

    add(command, aliases) {
        if (!Array.isArray(aliases)) aliases = [aliases];
        
        aliases.forEach(alias => {
            this.aliases.set(alias, command);
            this.client.logs.info(`Alias '${alias}' ajouté pour la commande '${command}'`);
        });
    }

    get(alias) {
        return this.aliases.get(alias);
    }
} 

module.exports = AliasManager;
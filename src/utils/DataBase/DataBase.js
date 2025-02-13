const fs = require("fs");
const path = require("path");
const { AdvancedDatabase: MongoDB } = require("./MongoDBManager.js");
const { MySQLDatabase } = require("./MySQLManager");
const client = require("../../../index.js");
const config = require("../../config/main.json");
const log = require("../logs.js");

class Database {
    constructor(client) {
        this.client = client;
        this.config = config.database;
        this.log = log;
        this.database = null;
        this.init();
    }

    async init() {
        if (!this.config || !this.config.type) {
            console.log(this.config);
            this.log.error("❌ Configuration de la base de données manquante !");
            process.exit(1);
        }

        try {
            if (this.config.type === "mongodb") {
                this.log.info("📡 Connexion à MongoDB...");
                this.database = new MongoDB(this.config.mongodb.uri, this.log);
                this.log.success("✅ Connexion à MongoDB établie !");
            } else if (this.config.type === "mysql") {
                this.log.info("🔗 Connexion à MySQL...");
                this.database = new MySQLDatabase(this.config.mysql, this.log);
                await this.database.query("SELECT 1"); // Vérifie la connexion MySQL
                this.log.success("✅ Connexion à MySQL établie !");
            } else {
                this.log.error(`❌ Type de base de données invalide : '${this.config.type}'`);
                process.exit(1);
            }
        } catch (error) {
            this.log.error(`❌ Erreur de connexion : ${error.message}`);
            process.exit(1);
        }
    }

    async createTable(tableName, columns) {
        if (!this.database) await this.init();
        if (this.config.type === "mysql") {
            const columnsDefinition = columns.map(column => `${column.name} ${column.type}`).join(", ");
            const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnsDefinition})`;
            return await this.database.query(sql);
        } else {
            throw new Error("Table creation is only supported for MySQL.");
        }
    }

    async set(key, value) {
        if (!this.database) await this.init();
        if (this.config.type === "mongodb") {
            return await this.database.create("bot_data", { key, value });
        } else if (this.config.type === "mysql") {
            return await this.database.query(
                "INSERT INTO bot_data (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?",
                [key, value, value]
            );
        }
    }

    async get(key) {
        if (!this.database) await this.init();
        if (this.config.type === "mongodb") {
            const entry = await this.database.find("bot_data", { key });
            return entry.length ? entry[0].value : null;
        } else if (this.config.type === "mysql") {
            const results = await this.database.query("SELECT `value` FROM bot_data WHERE `key` = ?", [key]);
            return results.length ? results[0].value : null;
        }
    }

    async delete(key) {
        if (!this.database) await this.init();
        if (this.config.type === "mongodb") {
            return await this.database.delete("bot_data", { key });
        } else if (this.config.type === "mysql") {
            const result = await this.database.query("DELETE FROM bot_data WHERE `key` = ?", [key]);
            return result.affectedRows > 0;
        }
    }

    async getAllKeys() {
        if (!this.database) await this.init();
        if (this.config.type === "mongodb") {
            const keys = await this.database.find("bot_data", {}).project({ key: 1 }).toArray();
            return keys.length ? keys.map(entry => entry.key) : [];
        } else if (this.config.type === "mysql") {
            const keys = await this.database.query("SELECT `key` FROM bot_data");
            return keys.length ? keys.map(entry => entry.key) : [];
        }
        return [];
    }

    async close() {
        if (this.config.type === "mysql" && this.database) {
            await this.database.end();
            this.log.info("🔌 Connexion MySQL fermée.");
        } else if (this.config.type === "mongodb" && this.database) {
            await this.database.client.close();
            this.log.info("🔌 Connexion MongoDB fermée.");
        }
    }
}

module.exports = Database;

const mongoose = require("mongoose");

class AdvancedDatabase {
    constructor(uri, log) {
        this.uri = uri;
        this.log = log;
        this.connect();
    }

    async connect() {
        if (!this.uri) {
            this.log.error("❌ URI MongoDB manquante !");
            process.exit(1);
        }

        try {
            await mongoose.connect(this.uri);
            this.log.success("✅ Connecté à MongoDB !");
        } catch (err) {
            this.log.error(`❌ Erreur de connexion MongoDB : ${err.message}`);
            setTimeout(() => this.connect(), 5000);
        }

        mongoose.connection.on("error", (err) => this.log.error(`❌ Erreur MongoDB : ${err.message}`));
        mongoose.connection.on("disconnected", () => {
            this.log.warn("⚠️ MongoDB déconnecté !");
            setTimeout(() => this.connect(), 5000);
        });

        process.on("SIGINT", async () => {
            await mongoose.connection.close();
            this.log.warn("🔌 Fermeture MongoDB.");
            process.exit(0);
        });
    }

    async create(collection, data) {
        const Model = mongoose.model(collection, new mongoose.Schema({}, { strict: false }));
        return await Model.create(data);
    }

    async find(collection, query) {
        const Model = mongoose.model(collection, new mongoose.Schema({}, { strict: false }));
        return await Model.find(query);
    }
}

module.exports = { AdvancedDatabase };

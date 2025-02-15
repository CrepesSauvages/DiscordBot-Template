const mongoose = require("mongoose");

class AdvancedDatabase {
    constructor(uri, log) {
        this.uri = uri;
        this.log = log;
        this.models = {}; // Stocke les modèles pour éviter l'erreur OverwriteModelError
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

    // Récupère ou crée un modèle avec un schéma défini
    getModel(collection, schemaDefinition = null) {
        if (!this.models[collection]) {
            const schema = schemaDefinition
                ? new mongoose.Schema(schemaDefinition, { strict: true })
                : new mongoose.Schema({}, { strict: false });

            this.models[collection] = mongoose.models[collection] || mongoose.model(collection, schema);
        }
        return this.models[collection];
    }

    // Schéma strict pour bot_data
    getBotDataModel() {
        return this.getModel("bot_data", {
            key: { type: String, required: true, unique: true },
            value: { type: mongoose.Schema.Types.Mixed, required: true },
            createdAt: { type: Date, default: Date.now }
        });
    }

    async create(collection, data, schema = null) {
        try {
            const Model = schema ? this.getModel(collection, schema) : this.getBotDataModel();
            return await Model.create(data);
        } catch (error) {
            this.log.error(`❌ Erreur lors de la création dans ${collection} : ${error.message}`);
            return null;
        }
    }

    async find(collection, query, schema = null) {
        try {
            const Model = schema ? this.getModel(collection, schema) : this.getBotDataModel();
            return await Model.find(query);
        } catch (error) {
            this.log.error(`❌ Erreur lors de la recherche dans ${collection} : ${error.message}`);
            return [];
        }
    }

    async delete(collection, query, schema = null) {
        try {
            const Model = schema ? this.getModel(collection, schema) : this.getBotDataModel();
            return await Model.deleteOne(query);
        } catch (error) {
            this.log.error(`❌ Erreur lors de la suppression dans ${collection} : ${error.message}`);
            return false;
        }
    }
}

module.exports = { AdvancedDatabase };

const mongoose = require('mongoose');

class AdvancedDatabase {
    constructor(uri, log, options = {}) {
        this.uri = uri;
        this.log = log; // Utilise le logger fourni par le client
        this.options = { ...options };
        this.connect();
    }

    async connect() {
        if (!this.uri) {
            this.log.error("❌ MongoDB URI non fourni dans la configuration !");
            process.exit(1);
        }

        try {
            await mongoose.connect(this.uri, this.options);
            this.log.success("✅ Connexion à MongoDB établie avec succès !");
        } catch (err) {
            this.log.error(`❌ Erreur de connexion à MongoDB : ${err.message}`);
            setTimeout(() => this.connect(), 5000);
        }

        mongoose.connection.on("connected", () => {
            this.log.info("🔗 MongoDB connecté !");
        });

        mongoose.connection.on("error", (err) => {
            this.log.error(`❌ Erreur MongoDB : ${err.message}`);
        });

        mongoose.connection.on("disconnected", () => {
            this.log.warn("⚠️ MongoDB déconnecté !");
            setTimeout(() => this.connect(), 5000);
        });

        process.on("SIGINT", async () => {
            await mongoose.connection.close();
            this.log.warn("🔌 Déconnexion de MongoDB suite à l'arrêt du bot.");
            process.exit(0);
        });
    }
}

module.exports = { AdvancedDatabase };
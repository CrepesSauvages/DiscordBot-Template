const mongoose = require('mongoose');
const log = require('../logs.js');

/**
 * Initialise la connexion à MongoDB.
 * @param {string} mongoUri URI de connexion à MongoDB.
 */
async function connectDatabase(mongoUri) {
    if (!mongoUri) {
        log.error("❌ MongoDB URI non fourni dans la configuration !");
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
        });

        log.success("✅ Connexion à MongoDB établie avec succès !");
    } catch (err) {
        log.error(`❌ Erreur de connexion à MongoDB : ${err.message}`);
        process.exit(1);
    }

    // Événements de connexion
    mongoose.connection.on("connected", () => {
        log.info("🔗 MongoDB connecté !");
    });

    mongoose.connection.on("error", (err) => {
        log.error(`❌ Erreur MongoDB : ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
        log.warn("⚠️ MongoDB déconnecté !");
    });

    // Si le bot est arrêté, fermer la connexion proprement
    process.on("SIGINT", async () => {
        await mongoose.connection.close();
        log.warn("🔌 Déconnexion de MongoDB suite à l'arrêt du bot.");
        process.exit(0);
    });
}

module.exports = { connectDatabase };

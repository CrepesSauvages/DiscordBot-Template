const { connect } = require('mongoose');
const fs = require('fs');
const path = require('path');
const GuildRewards = require('../../utils/Schemas/Level/GuildRewards');

async function migrateRewards(client) {
    try {
        console.log('Début de la migration des récompenses...');

        // Lire l'ancien fichier JSON
        const configPath = path.join(__dirname, '../../config/levelRewards.json');
        const oldRewards = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // Récupérer toutes les guildes
        const guilds = client.guilds.cache;

        // Pour chaque guilde, créer une entrée dans la base de données
        for (const guild of guilds.values()) {
            console.log(`Migration des récompenses pour la guilde: ${guild.name} (${guild.id})`);

            // Convertir les permissions du format ancien vers le nouveau
            const permissionsMap = new Map();
            for (const [level, perms] of Object.entries(oldRewards.permissions)) {
                permissionsMap.set(level, perms);
            }

            // Créer ou mettre à jour les récompenses pour cette guilde
            await GuildRewards.findOneAndUpdate(
                { guildId: guild.id },
                {
                    $setOnInsert: {
                        rewards: oldRewards.rewards,
                        permissions: permissionsMap
                    }
                },
                { upsert: true, new: true }
            );
        }

        // Créer une sauvegarde de l'ancien fichier JSON
        const backupPath = path.join(__dirname, '../../config/levelRewards.backup.json');
        fs.copyFileSync(configPath, backupPath);
        console.log(`Sauvegarde de l'ancien fichier créée: ${backupPath}`);

        // Optionnel: Supprimer l'ancien fichier JSON
        // fs.unlinkSync(configPath);
        // console.log('Ancien fichier JSON supprimé');

        console.log('Migration terminée avec succès!');
        return true;
    } catch (error) {
        console.error('Erreur lors de la migration:', error);
        return false;
    }
}

module.exports = { migrateRewards }; 
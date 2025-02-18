const fs = require('fs');
const path = require('path');
const log = require('./logs.js');

/**
 * Lit récursivement un dossier et retourne les fichiers `.js` sous forme d'objet.
 * @param {string} basePath Chemin relatif du dossier à lire (ex: 'events')
 * @param {number} depth Profondeur maximale de lecture (par défaut 3)
 * @returns {Array<{ path: string, depth: number, data: any }>}
 */
function ReadFolder(basePath = '', depth = 3) {
    const folderPath = path.join(__dirname, '..', basePath);
    const files = [];

    function readDirRecursively(currentPath, currentDepth) {
        if (currentDepth < 0) return;

        if (!fs.existsSync(currentPath)) {
            log.warn(`⚠️ Le dossier "${currentPath}" n'existe pas, lecture ignorée.`);
            return;
        }

        if (!fs.existsSync(currentPath)) {
        const altPath = path.join(__dirname, '..', 'components', basePath);
        if (fs.existsSync(altPath)) {
            log.warn(`📂 Le dossier "${currentPath}" est introuvable, utilisation de "${altPath}" à la place.`);
            readDirRecursively(altPath, currentDepth);
            return;
        }
        log.warn(`⚠️ Le dossier "${currentPath}" et son alternative n'existent pas, lecture ignorée.`);
        return;
}


        const items = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const item of items) {
            const itemPath = path.join(currentPath, item.name);
            const relativePath = path.relative(path.join(__dirname, '..'), itemPath);

            if (item.isDirectory()) {
                if (currentDepth > 0) {
                    readDirRecursively(itemPath, currentDepth - 1);
                } else {
                    log.warn(`⚠️ Profondeur maximale atteinte, dossier ignoré : ${relativePath}`);
                }
                continue;
            }

            if (!item.name.endsWith('.js')) continue;

            try {
                const data = require(itemPath) || {};
                files.push({ path: relativePath, depth: currentDepth, data });
            } catch (error) {
                log.error(`❌ Erreur lors du chargement de ${relativePath} : ${error.stack || error}`);
            }
        }
    }

    readDirRecursively(folderPath, depth);
    return files;
}

module.exports = ReadFolder;

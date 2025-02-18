const { inspect } = require('node:util');
const fs = require('fs');
const path = require('path');

const color = {
    red: '\x1b[31m',
    orange: '\x1b[38;5;202m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    pink: '\x1b[35m',
    purple: '\x1b[38;5;129m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
    lightBlue: '\x1b[94m',
    lightGreen: '\x1b[92m',
    lightCyan: '\x1b[96m',
    lightRed: '\x1b[91m',
    lightPurple: '\x1b[95m',
    lightYellow: '\x1b[93m',
    lightGray: '\x1b[37m',
    darkGray: '\x1b[90m'
}

function getTimestamp() {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Fonction pour parser les messages (convertit les objets en chaînes)
function parse(message) {
    if (typeof message === 'object') {
        return JSON.stringify(message, null, 2);
    }
    return message;
}

// Fonction pour écrire dans un fichier de log
function logToFile(message, level = 'info') {
    const timestamp = getTimestamp();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${parse(message)}\n`;
    const logFile = path.join(logsDir, `${level}.log`);
    fs.appendFileSync(logFile, logMessage);
}

function custom(message, hexColor) {
    switch (typeof hexColor) {
        case 'string':
            // conver to int
            hexColor = parseInt(hexColor.replace('#', ''), 16);
            break;
        case 'number':
            // do nothing
            break;
        default:
            hexColor = 0;
            break;
    }
    const rgb = [(hexColor >> 16) & 0xFF, (hexColor >> 8) & 0xFF, hexColor & 0xFF];
    const ansiRGB = `\x1b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
    console.log(`${ansiRGB}[${getTimestamp()}]${color.reset} ${parse(message)}`);
}

// Fonction pour nettoyer les anciens logs (plus de 7 jours)
function cleanOldLogs() {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes
    fs.readdir(logsDir, (err, files) => {
        if (err) return;
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlink(filePath, () => {});
                }
            });
        });
    });
}

// Nettoyage automatique des logs tous les jours
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

module.exports = {
    info: (message) => {
        console.log(`${color.blue}[${getTimestamp()}]${color.reset} ${parse(message)}`);
        logToFile(message, 'info');
    },
    success: (message) => {
        console.log(`${color.green}[${getTimestamp()}]${color.reset} ${parse(message)}`);
        logToFile(message, 'success');
    },
    warn: (message) => {
        console.log(`${color.yellow}[${getTimestamp()}]${color.reset} ${parse(message)}`);
        logToFile(message, 'warning');
    },
    error: (message) => {
        console.log(`${color.red}[${getTimestamp()}]${color.reset} ${parse(message)}`);
        logToFile(message, 'error');
    },
    debug: (message) => {
        console.log(`${color.magenta}[${getTimestamp()}]${color.reset} ${parse(message)}`);
        logToFile(message, 'debug');
    },
    critical: (message) => {
        console.log(`${color.lightRed}[${getTimestamp()}]${color.reset} ${parse(message)}`);
        logToFile(message, 'critical');
    },
    verbose: (message) => {
        console.log(`${color.lightCyan}[${getTimestamp()}]${color.reset} ${parse(message)}`);
        logToFile(message, 'verbose');
    }, 
    custom: (message, hexColor) => {
        custom(message, hexColor);
        logToFile(message, 'custom');
    }
};
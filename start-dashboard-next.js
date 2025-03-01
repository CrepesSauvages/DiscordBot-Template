const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Fonction pour trouver le chemin de npm
function findNpmPath() {
  // Chemins possibles pour npm
  const possiblePaths = [
    // Windows
    'C:\\Program Files\\nodejs\\npm.cmd',
    'C:\\Program Files (x86)\\nodejs\\npm.cmd',
    path.join(process.env.APPDATA, 'npm', 'npm.cmd'),
    // Utiliser le même répertoire que node
    path.join(path.dirname(process.execPath), 'npm'),
    path.join(path.dirname(process.execPath), 'npm.cmd')
  ];

  // Vérifier chaque chemin
  for (const npmPath of possiblePaths) {
    if (fs.existsSync(npmPath)) {
      return npmPath;
    }
  }

  // Si npm n'est pas trouvé, utiliser npx
  const npxPaths = [
    'C:\\Program Files\\nodejs\\npx.cmd',
    'C:\\Program Files (x86)\\nodejs\\npx.cmd',
    path.join(process.env.APPDATA, 'npm', 'npx.cmd'),
    path.join(path.dirname(process.execPath), 'npx'),
    path.join(path.dirname(process.execPath), 'npx.cmd')
  ];

  for (const npxPath of npxPaths) {
    if (fs.existsSync(npxPath)) {
      return npxPath;
    }
  }

  return 'node';
}

// Démarrer le bot Discord
const botProcess = spawn('node', ['index.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Trouver le chemin de npm
const npmPath = findNpmPath();
console.log(`Utilisation de npm au chemin: ${npmPath}`);

// Utiliser "start" au lieu de "dev" pour le mode production
const dashboardProcess = npmPath === 'node'
  ? spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', '3000'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, 'dashboard-next'),
      env: { ...process.env, NODE_ENV: 'production' }
    })
  : spawn(npmPath, ['run', 'start'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, 'dashboard-next'),
      shell: true,
      env: { ...process.env, NODE_ENV: 'production' }
    });

// Gestion des erreurs et de la fermeture
botProcess.on('error', (error) => {
  console.error(`Erreur lors du démarrage du bot: ${error.message}`);
});

dashboardProcess.on('error', (error) => {
  console.error(`Erreur lors du démarrage du dashboard: ${error.message}`);
});

// Arrêter les deux processus si l'un d'eux se termine
botProcess.on('close', (code) => {
  console.log(`Le bot s'est arrêté avec le code: ${code}`);
  dashboardProcess.kill();
  process.exit(code);
});

dashboardProcess.on('close', (code) => {
  console.log(`Le dashboard s'est arrêté avec le code: ${code}`);
  botProcess.kill();
  process.exit(code);
});

// Gestion de l'arrêt du processus principal
process.on('SIGINT', () => {
  botProcess.kill();
  dashboardProcess.kill();
  process.exit(0);
});
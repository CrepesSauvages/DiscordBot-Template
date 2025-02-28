# Discord Bot Template

Un bot Discord modulaire et extensible avec gestion des commandes temporaires, des alias, des événements personnalisés et support multilingue.

## 🌟 Fonctionnalités

- ⚡ Système de commandes slash avec gestion des sous-commandes
- ⏱️ Commandes temporaires avec durée configurable
- 🔄 Alias de commandes
- 🌍 Support multilingue (FR, EN)
- 🛡️ Système de permissions avancé
- 🎯 Gestion des cooldowns
- 📊 Base de données MongoDB intégrée
- 🔌 Système de composants (boutons, menus, modals)
- 📝 Logs détaillés
- 🔄 Rechargement à chaud des commandes
- 👮 Système de modération avancé
  - Mute temporaire et permanent
  - Historique des mutes
  - Auto-unmute
  - Logs de modération multilingues

## 📋 Prérequis

- Node.js v16.9.0 ou supérieur
- MongoDB
- Un token de bot Discord
- Une application Discord avec les intents nécessaires

## ⚙️ Installation

1. Clonez le repository
```bash
git clone https://github.com/CrepesSauvages/DiscordBot-Template
```
2. Install Modules
```bash
npm install
```
3. Configurez le fichier `src/config/main.json`
```json
{
    "token": "YOUR_BOT_TOKEN_HERE",
    "app_ip": "CLIENT ID",
    "dev_guild_id": "SERVER ID",
    "prefix": "!",
    "ownerID": "YOUR_DISCORD_ID",
    "devs": ["ID1", "ID2"],
    "database": {
        "mongodb": {
            "uri": "MongoDB URI"
        }
    },
}
```

4. Démarrez le bot
```bash
node .
```

## 🔧 Commandes principales

- `/help` : Afficher la liste des commandes
- `/language` : Changer la langue du serveur
- `/ping` : Vérifier la latence du bot

## 🔧 Commandes de développement

- `/temp create` : Créer une commande temporaire
- `/temp list` : Lister les commandes temporaires actives
- `/temp delete` : Supprimer une commande temporaire
- `/temp extend` : Prolonger la durée d'une commande temporaire

## 🛡️ Commandes de modération
- `/mute` : Mute un utilisateur (temporairement ou de forme permanente)
- `/unmute` : Unmute un utilisateur
- `/mutehistory` : Voir l'historique des mutes d'un utilisateur

## 📁 Structure du projet
    ├── index.js
    ├── package.json
    └── src/
        ├── commands/ # Commandes du bot
        │   ├── Admin/
        │   │   └── language.js
        │   ├── Dev/
        │   │   ├── restricted.js
        │   │   ├── temp_manager.js
        │   │   └── test_bot.js
        ├── Modération/
        │   ├── mute.js
        │   ├── unmute.js
        │   └── mutehistory.js
        └── Utils/
            ├── help.js
            └── ping.js
        ├── components/ # Composants interactifs
        │   ├── buttons/
        │   ├── menus/
        │   └── modals/
        ├── config/ # Fichiers de configuration
        ├── events/ # Gestionnaires d'événements
        ├── locales/ # Fichiers de traduction
        │   ├── en.json
        │   └── fr.json
        └── utils/ # Utilitaires et helpers
            ├── LocaleManager.js
            ├── System/
            │   └── Modération/
            │       └── ModerationService.js
            └── ... autres utilitaires ...

## 🛠️ Développement

### Créer une nouvelle commande
```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('command_name')
        .setDescription('Command description'),
    async execute(interaction, client) {
        const locale = await client.locales.getGuildLocale(interaction.guildId);
        // Votre code ici
    }
};

```

### Ajouter des traductions
```json
{
    "commands": {
        "command_name": {
            "name": "nom_commande",
            "description": "Description de la commande",
            "responses": {
                "success": "Message de succès",
                "error": "Message d'erreur"
            }
        }
    }
}
```

## 📝 Logs et Traductions
Le bot utilise un système de logs avancé qui supporte :

- Logs dans la console avec codes couleurs
- Logs dans des canaux Discord spécifiques
- Support multilingue pour tous les messages
- Formatage automatique des embeds

## 📜 License

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.


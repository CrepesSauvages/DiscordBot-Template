# Discord Bot Template

Un bot Discord modulaire et extensible avec gestion des commandes temporaires, des alias et des événements personnalisés.

## 🌟 Fonctionnalités

- ⚡ Système de commandes slash avec gestion des sous-commandes
- ⏱️ Commandes temporaires avec durée configurable
- 🔄 Alias de commandes
- 🛡️ Système de permissions avancé
- 🎯 Gestion des cooldowns
- 📊 Base de données MongoDB intégrée
- 🔌 Système de composants (boutons, menus, modals)
- 📝 Logs détaillés
- 🔄 Rechargement à chaud des commandes

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

4. Démarrez le bot
```bash
node .
```

## 🔧 Commandes de développement

- `/temp create` : Créer une commande temporaire
- `/temp list` : Lister les commandes temporaires actives
- `/temp delete` : Supprimer une commande temporaire
- `/temp extend` : Prolonger la durée d'une commande temporaire

## 📁 Structure du projet
    ├── index.js
    ├── package.json
    └── src/
        ├── commands/ # Commandes du bot
        │   ├── Dev/
        │   │   ├── restricted.js
        │   │   ├── temp_manager.js
        │   │   └── test_bot.js
        │   └── Utils/
        │       └── ping.js
        ├── components/ # Commandes du bot
        │   ├── buttons/
        │   │   ├── save.js
        │   │   ├── test_button.js
        │   │   └── navigation/
        │   │       ├── close.js
        │   │       └── goto.js
        │   ├── menus/
        │   │   └── test_menue.js
        │   └── modals/
        │       └── test_modal.js
        ├── config/ # Fichiers de configuration
        │   ├── commandsCache.json
        │   └── main.template.json
        ├── events/ # Gestionnaires d'événements
        │   ├── client/
        │   │   └── ready.js
        │   └── interaction/
        │       └── interactionCreate.js
        └── utils/ # Utilitaires et helpers
            ├── AliasManager.js
            ├── CustomEvents.js
            ├── ReadingFolder.js
            ├── TempCommands.js
            ├── logs.js
            ├── Checker/
            │   ├── Cooldown.js
            │   ├── GuildAccess.js
            │   ├── Permissions.js
            │   └── UserAccess.js
            ├── DataBase/
            │   └── DataBase.js
            ├── Handlers/
            │   ├── ComponentLoader.js
            │   ├── EvenementLoaders.js
            │   └── RegistreCommands.js
            ├── Init/
            │   ├── CheckIntents.js
            │   ├── CheckPackages.js
            │   └── ProcessHandling.js
            ├── Overrides/
            │   ├── Collector.js
            │   └── InteractionOverrides.js
            └── Schemas/
                └── DataBase/
                    └── DataBase.js



## 🛠️ Développement

### Créer une nouvelle commande
```javascript
const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('command_name')
    .setDescription('Command description'),
  async execute(interaction, client) {
    // Votre code ici
  }
};

```


### Créer une commande temporaire

```javascript
client.tempCommands.create('command_name', {
  data: commandData,
  execute: async (interaction) => {
  // Votre code ici
  }
}, duration);

```


## 📜 License

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.


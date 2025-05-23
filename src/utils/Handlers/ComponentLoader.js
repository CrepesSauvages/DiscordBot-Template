const ReadFolder = require('../ReadingFolder');
const { existsSync } = require('node:fs');
const path = require('path');

const { PermissionsBitField: { Flags: Permissions } } = require('discord.js');

const modules = [
	'commands',
	'components/buttons',
	'components/menus',
	'components/modals',
];


module.exports = function (client, folder = null) {
	if (!client.tempCommands) client.tempCommands = new Map();
	if (!client.aliases) client.aliases = new Map();

	for (const module of modules) {
		if (typeof folder === 'string' && folder !== module) continue;

		client[module] = new Map();

		if (!existsSync(path.join(__dirname, '..', '..', module)))  {
			client.logs.warn(`No ${module} folder found - Skipping...`);
			continue;
		}

		const files = ReadFolder(module);
		for (const { path: filePath, data } of files) {
			try {
				if (!data.execute) throw `No execute function found`;
				if (typeof data.execute !== 'function') throw `Execute is not a function`;
				
				if (data.roles) {
					if (!Array.isArray(data.roles)) throw `Invalid roles type - Must be an array`;
					if (data.roles.every(role => typeof role !== 'string')) throw `Invalid roles type - Must be an array of strings`;
				}

				if (data.users) {
					if (!Array.isArray(data.users)) throw `Invalid users type - Must be an array`;
					if (data.users.every(user => typeof user !== 'string')) throw `Invalid users type - Must be an array of strings`;
				}

				if (data.botPerms) {
					if (!Array.isArray(data.botPerms)) throw `Invalid bot permissions type - Must be an array`;
					if (data.botPerms.every(perm => typeof perm !== 'string')) throw `Invalid bot permissions type - Must be an array of strings`;
					CheckPerms(data.botPerms, 'bot');
				}

				if (data.userPerms) {
					if (!Array.isArray(data.userPerms)) throw `Invalid user permissions type - Must be an array`;
					if (data.userPerms.every(perm => typeof perm !== 'string')) throw `Invalid user permissions type - Must be an array of strings`;
					CheckPerms(data.userPerms, 'user');
				}

				if (data.guilds) {
					if (!Array.isArray(data.guilds)) throw `Invalid guilds type - Must be an array`;
					if (data.guilds.every(guild => typeof guild !== 'string')) throw `Invalid guilds type - Must be an array of strings`;
				}

				if (data.dev && typeof data.dev !== 'boolean') throw 'Invalid dev type - Must be a boolean';
				
				if (data.cooldown && typeof data.cooldown !== 'number') throw 'Invalid cooldown type - Must be a number (seconds)';
				if (data.cooldown && data.cooldown < 0) throw 'Invalid cooldown time - Must be greater than 0';

				const aliases = data.alias ?? data.aliases ?? [];
				if (aliases && (module === 'commands' || module === 'messages')) {
					if (!Array.isArray(aliases) && typeof aliases !== 'string') throw 'Invalid alias type - Must be a string or an array';
					data.aliases = Array.isArray(aliases) ? aliases : [aliases];
					for (const alias of aliases) {
						if (typeof alias !== 'string') throw 'Invalid alias - Must be a string';
						if (alias.length > 32) throw 'Alias is too long - Must be less than 32 characters';
						if (alias.includes(' ')) throw 'Alias cannot contain spaces';
					}
				}

				// Gestion des alias
				if (data.aliases && Array.isArray(data.aliases)) {
					data.aliases.forEach(alias => {
						client.aliases.set(alias, data.data.name);
					});
				}

				// Gestion des commandes temporaires
				if (data.temporary) {
					const duration = data.temporary.duration || 3600000; // 1 heure par défaut
					client.tempCommands.set(data.data.name, {
						expires: Date.now() + duration,
						data: data
					});

					setTimeout(() => {
						client.tempCommands.delete(data.data.name);
						client.logs.info(`Commande temporaire ${data.data.name} expirée`);
					}, duration);
				}

				switch (module) {
					case 'messages':
						if (!data.name) throw 'No name property found';
						if (!data.description) throw 'No description property found';
						addComponent(client[module], data.name, data);
						for (const alias of data.aliases) {
							addComponent(client[module], alias, data);
						}
						break;
					case 'commands':
						if (!data.data) throw 'No data property found';
						addComponent(client[module], data.data.name, data);
						for (const alias of data.aliases) {
							addComponent(client[module], alias, { ...data, data: { ...data.data, name: alias } });
						}
						break;
					case 'buttons':
					case 'menus':
					case 'modals':
						if (!data.customID) throw 'No custom ID has been set';
						if (typeof data.customID !== 'string') throw 'Invalid custom ID type - Must be string';
						addComponent(client[module], data.customID, data);
						break;
				}
			} catch (error) {
				client.logs.error(`Erreur lors du chargement de ${filePath}: ${error}`);
			}
		}
		client.logs.info(`Loaded ${client[module].size} ${module}`)
	}
};

function CheckPerms(perms, type) {
	if (!Array.isArray(perms)) return;
	const invalidPerms = [];
	for (let i = 0; i < perms.length; i++) {
		if (Permissions[perms[i]]) continue;
		invalidPerms.push(perms[i]);
	}
	if (invalidPerms.length > 0) throw `Invalid ${type} permissions found: ${invalidPerms.join(', ')}`;
}

function addComponent(map, id, data) {
	const duplicateIDs = [];

	if (map.has(id)) duplicateIDs.push(id);
	map.set(id, data);

	if (duplicateIDs.length > 0) throw `Duplicate IDs found: ${duplicateIDs.join(', ')}`;
}
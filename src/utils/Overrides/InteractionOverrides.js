'use strict';
const { InteractionResponseType, MessageFlags, Routes, InteractionType } = require("discord.js");
const InteractionResponse = require(`../../../node_modules/discord.js/src/structures/InteractionResponse`);
const MessagePayload = require(`../../../node_modules/discord.js/src/structures/MessagePayload`);

// DJS really doesn't want you to edit this so we have to do it a little funny lol
const InteractionResponses = require("../../../node_modules/discord.js/src/structures/interfaces/InteractionResponses");
class InteractionOverrides {

	// interaction.deferReply({ hidden: true, content: 'You can now send a message with a defer :D' });
	async deferReply(options = {}) {
		if (typeof options === 'string') options = { content: options };
		if (this.deferred || this.replied) return;
		this.ephemeral = options.hidden ?? options.ephemeral ?? false;
		await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
			body: {
				type: InteractionResponseType.DeferredChannelMessageWithSource,
				data: {
					flags: options.hidden ? MessageFlags.Ephemeral : undefined,
				},
			},
			auth: false,
		});
		this.deferred = true;

		if (options.content) return await this.editReply(options);

		return options.fetchReply ? this.fetchReply() : new InteractionResponse(this);
	}

	// interaction.reply({ hidden: true, content: 'You can now use hidden or ephemeral, using reply() multiple times does not break' });
	async reply(options) {
		if (this.deferred) return this.editReply(options);
		if (this.replied) return this.followUp(options);
		this.ephemeral = options.hidden ?? options.ephemeral ?? false;

		const messagePayload = options instanceof MessagePayload ? options : MessagePayload.create(this, options);

		const { body: data, files } = await messagePayload.resolveBody().resolveFiles();

		await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
			body: {
				type: InteractionResponseType.ChannelMessageWithSource,
				data
			},
			files,
			auth: false
		});
		this.replied = true;

		return options.fetchReply ? this.fetchReply() : new InteractionResponse(this);
	}

	fetchReply(message = '@original') {
		return this.webhook.fetchMessage(message);
	}

	async editReply(options) {
		if (!this.deferred && !this.replied) return this.reply(options);
		const msg = await this.webhook.editMessage(options.message ?? '@original', options);
		this.replied = true;
		return msg;
	}

	async deleteReply(message = '@original') {
		if (!this.replied && !this.deferred) await this.deferReply({ hidden: true });
		await this.webhook.deleteMessage(message);
	}

	async followUp(options) {
		if (!this.deferred && !this.replied) return this.reply(options);
		return this.webhook.send(options);
	}

	async deferUpdate(options = {}) {
		if (typeof options === 'string') options = { content: options };
		if (this.deferred || this.replied) return;
		if (this.type === InteractionType.ApplicationCommand) return this.deferReply(options);
		await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
			body: {
				type: InteractionResponseType.DeferredMessageUpdate,
			},
			auth: false,
		});
		this.deferred = true;

		if (options.content) return await this.editReply(options);

		return options.fetchReply ? this.fetchReply() : new InteractionResponse(this, this.message?.interaction?.id);
	}

	async update(options) {
		if (this.deferred || this.replied) return this.editReply(options);

		const messagePayload = options instanceof MessagePayload ? options : MessagePayload.create(this, options);

		const { body: data, files } = await messagePayload.resolveBody().resolveFiles();

		await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
			body: {
				type: InteractionResponseType.UpdateMessage,
				data,
			},
			files,
			auth: false,
		});
		this.replied = true;

		return options.fetchReply ? this.fetchReply() : new InteractionResponse(this, this.message.interaction?.id);
	}

	async showModal(modal) {
		if (this.deferred || this.replied) throw new Error('You cannot send a modal after replying to the interaction');
		await this.client.rest.post(Routes.interactionCallback(this.id, this.token), {
			body: {
				type: InteractionResponseType.Modal,
				data: typeof modal.toJSON === 'function' ? modal.toJSON() : this.client.options.jsonTransformer(modal),
			},
			auth: false,
		});
		this.replied = true;
	}

	static applyToClass(structure, ignore = []) {
		const props = Object.getOwnPropertyNames(InteractionOverrides.prototype);

		const blockedProps = [
			'constructor',
			'applyToClass',
			'overrideInteractionResponses'
		]
	
		for (const prop of props) {
			if (ignore.includes(prop) && !blockedProps.includes(prop)) continue;
			Object.defineProperty(
				structure.prototype,
				prop,
				this[prop]
			);
		}
	}

	static overrideInteractionResponses() {
		// Here we override literally everything in the class with our own methods
		for (const prop of Object.getOwnPropertyNames(InteractionOverrides.prototype)) {
			InteractionResponses.prototype[prop] = InteractionOverrides.prototype[prop];
		}
		console.log('Overridden InteractionResponses');
	}


}

module.exports = InteractionOverrides.overrideInteractionResponses;

const { LevelSystem } = require('../../utils/System/Level/levelSystem');
const { EmbedBuilder } = require('discord.js');
const GuildSettings = require('../../utils/Schemas/Level/GuildSettings');

module.exports = {
    name: 'messageCreate',
    once: false,
    /**
     * 
     * @param {Message} message 
     * @returns 
     */
    async execute(client, message) {
        // Vérifier si c'est un bot ou si le message n'est pas dans un guild
        if (!message.guild || message.author.bot) return;

        try {
            // Vérifier les paramètres de la guilde
            const guildSettings = await GuildSettings.findOne({ guildId: message.guild.id });
            
            if (guildSettings) {
                // Vérifier si le canal est désactivé
                if (guildSettings.disabledChannels.includes(message.channel.id)) {
                    return;
                }

                // Calculer le multiplicateur total
                let totalMultiplier = 1.0;

                // Vérifier les multiplicateurs actifs
                for (const multiplier of guildSettings.xpMultipliers) {
                    // Ignorer les multiplicateurs expirés
                    if (multiplier.endDate && multiplier.endDate < new Date()) continue;

                    // Appliquer les multiplicateurs de rôle
                    if (multiplier.type === 'role' && message.member.roles.cache.has(multiplier.targetId)) {
                        totalMultiplier *= multiplier.multiplier;
                    }
                    // Appliquer les multiplicateurs de canal
                    else if (multiplier.type === 'channel' && multiplier.targetId === message.channel.id) {
                        totalMultiplier *= multiplier.multiplier;
                    }
                }

                // Ajouter de l'XP (entre 15-25 par message) avec le multiplicateur
                const baseXP = Math.floor(Math.random() * 11) + 15;
                const xpToAdd = Math.floor(baseXP * totalMultiplier);

                const result = await LevelSystem.addXP(message.author.id, message.guild.id, xpToAdd, message.client);

                // Si level up, envoyer un message
                if (result.levelUp) {
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('🎉 Niveau Supérieur!')
                        .setDescription(`Félicitations ${message.author}! Tu as atteint le niveau ${result.newLevel}!`)
                        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                        .setTimestamp();

                    // Si un canal spécifique est configuré pour les annonces de level up
                    if (guildSettings.levelUpChannel) {
                        const levelUpChannel = message.guild.channels.cache.get(guildSettings.levelUpChannel);
                        if (levelUpChannel) {
                            await levelUpChannel.send({ embeds: [embed] });
                            return;
                        }
                    }

                    // Sinon, envoyer dans le canal actuel
                    await message.channel.send({ embeds: [embed] });
                }
            } else {
                // Si pas de paramètres spéciaux, utiliser le comportement par défaut
                const xpToAdd = Math.floor(Math.random() * 11) + 15;
                const result = await LevelSystem.addXP(message.author.id, message.guild.id, xpToAdd, message.client);
                
                if (result.levelUp) {
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('🎉 Niveau Supérieur!')
                        .setDescription(`Félicitations ${message.author}! Tu as atteint le niveau ${result.newLevel}!`)
                        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                        .setTimestamp();

                    await message.channel.send({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.error('Erreur dans l\'événement messageCreate:', error);
        }
    }
};
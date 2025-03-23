const { LevelSystem } = require('../../utils/System/Level/levelSystem');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    once: false,
    /**
     * 
     * @param {Message} message 
     * @returns 
     */
    async execute(message) {
        // Vérifier si c'est un bot ou si le message n'est pas dans un guild
        if (!message.guild || message.author.bot) return;

        try {
            // Ajouter de l'XP (entre 15-25 par message)
            const xpToAdd = Math.floor(Math.random() * 11) + 15;
            const result = await LevelSystem.addXP(message.author.id, message.guild.id, xpToAdd, message.client);
            
            // Si level up, envoyer un message
            if (result.levelUp) {
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🎉 Niveau Supérieur!')
                    .setDescription(`Félicitations ${message.author}! Tu as atteint le niveau ${result.newLevel}!`)
                    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();

                await message.channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Erreur dans l\'événement messageCreate:', error);
        }
    }
};
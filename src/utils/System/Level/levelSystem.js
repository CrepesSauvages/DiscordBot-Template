const Levels = require('../../Schemas/Level/Levels');
const fs = require('fs');
const path = require('path');
const GuildRewards = require('../../Schemas/Level/GuildRewards');
const GuildSettings = require('../../Schemas/Level/GuildSettings');

class LevelSystem {
    static async addXP(userId, guildId, xpToAdd, client, message) {
        try {
            // Récupérer les paramètres de la guilde
            const guildSettings = await GuildSettings.findOne({ guildId });
            
            if (guildSettings && message?.channel) {
                // Vérifier si le canal est désactivé
                const channel = message.channel.id;
                if (guildSettings.disabledChannels.includes(channel)) {
                    return { levelUp: false };
                }

                // Calculer le multiplicateur total
                const member = await message.guild.members.fetch(userId);
                const channelId = message.channel.id;
                
                let totalMultiplier = 1.0;

                // Appliquer les multiplicateurs de rôle
                const roleMultipliers = guildSettings.xpMultipliers
                    .filter(m => m.type === 'role' && member.roles.cache.has(m.targetId));
                for (const mult of roleMultipliers) {
                    totalMultiplier *= mult.multiplier;
                }

                // Appliquer les multiplicateurs de canal
                const channelMultipliers = guildSettings.xpMultipliers
                    .filter(m => m.type === 'channel' && m.targetId === channelId);
                for (const mult of channelMultipliers) {
                    totalMultiplier *= mult.multiplier;
                }

                // Appliquer le multiplicateur à l'XP
                xpToAdd = Math.floor(xpToAdd * totalMultiplier);
            }

            // Cooldown de 60 secondes entre chaque gain d'XP
            const userLevel = await Levels.findOne({ userId, guildId });
            
            if (userLevel) {
                const timeDiff = Date.now() - userLevel.lastMessageTime;
                //if (timeDiff < 60000) return { levelUp: false }; // Cooldown actif
            }

            // Mettre à jour ou créer les données de niveau
            const updatedLevel = await Levels.findOneAndUpdate(
                { userId, guildId },
                {
                    $inc: { xp: xpToAdd },
                    $set: { lastMessageTime: Date.now() }
                },
                { upsert: true, new: true }
            );

            // Calculer le nouveau niveau potentiel
            const newLevel = this.calculateLevel(updatedLevel.xp);
            
            if (newLevel > updatedLevel.level) {
                await Levels.updateOne(
                    { userId, guildId },
                    { $set: { level: newLevel } }
                );
        
                // Appliquer les récompenses
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    await this.applyRewards(guild, userId, newLevel, client);
                }
        
                return {
                    levelUp: true,
                    oldLevel: updatedLevel.level,
                    newLevel: newLevel,
                    xp: updatedLevel.xp
                };
            }

            return {
                levelUp: false,
                level: updatedLevel.level,
                xp: updatedLevel.xp
            };
        } catch (error) {
            console.error('Erreur dans addXP:', error);
            return { error: true };
        }
    }

    static calculateLevel(xp) {
        return Math.floor(0.1 * Math.sqrt(xp));
    }

    static calculateXPForNextLevel(level) {
        return Math.pow((level + 1) / 0.1, 2);
    }

    static async getUserStats(userId, guildId) {
        try {
            const userLevel = await Levels.findOne({ userId, guildId });
            if (!userLevel) {
                return {
                    level: 0,
                    xp: 0,
                    rank: 0,
                    xpNeeded: this.calculateXPForNextLevel(0)
                };
            }

            const rank = await Levels.countDocuments({
                guildId,
                xp: { $gt: userLevel.xp }
            }) + 1;

            return {
                level: userLevel.level,
                xp: userLevel.xp,
                rank,
                xpNeeded: this.calculateXPForNextLevel(userLevel.level)
            };
        } catch (error) {
            console.error('Erreur dans getUserStats:', error);
            return { error: true };
        }
    }

    static async getLeaderboard(guildId, limit = 10) {
        try {
            return await Levels.find({ guildId })
                .sort({ xp: -1 })
                .limit(limit);
        } catch (error) {
            console.error('Erreur dans getLeaderboard:', error);
            return [];
        }
    }

    static async applyRewards(guild, userId, newLevel, client) {
        try {
            // Récupérer les récompenses spécifiques à la guilde
            const guildRewards = await GuildRewards.findOne({ guildId: guild.id });
            if (!guildRewards) return false;
            
            // Appliquer les rôles
            for (const reward of guildRewards.rewards) {
                if (newLevel >= reward.level) {
                    switch (reward.type) {
                        case 'role':
                            const role = guild.roles.cache.find(r => r.name === reward.value);
                            if (role) {
                                const member = await guild.members.fetch(userId);
                                await member.roles.add(role);
                            }
                            break;
                        case 'badge':
                            // À implémenter selon votre système de badges
                            break;
                    }
                }
            }

            // Appliquer les permissions
            if (guildRewards.permissions.has(newLevel.toString())) {
                const member = await guild.members.fetch(userId);
                const permissions = guildRewards.permissions.get(newLevel.toString());
                // À implémenter selon votre système de permissions
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de l\'application des récompenses:', error);
            return false;
        }
    }

    static async resetUser(userId, guildId) {
        try {
            await Levels.findOneAndDelete({ userId, guildId });
            return true;
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            return false;
        }
    }

    static async setLevel(userId, guildId, level) {
        try {
            const userLevel = await Levels.findOne({ userId, guildId });
            if (userLevel) {
                await Levels.updateOne(
                    { userId, guildId },
                    { $set: { level } }
                );
            } else {
                await Levels.create({ userId, guildId, level, xp: 0 });
            }
            return true;
        } catch (error) {
            console.error('Erreur lors de la définition du niveau:', error);
            return false;
        }
    }

    static async setXP(userId, guildId, xp) {
        try {
            const userLevel = await Levels.findOne({ userId, guildId });
            if (userLevel) {
                await Levels.updateOne(
                    { userId, guildId },
                    { $set: { xp } }
                );
            } else {
                await Levels.create({ userId, guildId, level: 0, xp });
            }
            return true;
        } catch (error) {
            console.error("Erreur lors de la définition de l'XP:", error);
            return false;
        }
    }

    static async addReward(guildId, level, type, value, description) {
        try {
            const reward = { level, type, value, description };
            await GuildRewards.findOneAndUpdate(
                { guildId },
                { $push: { rewards: reward } },
                { upsert: true }
            );
            return true;
        } catch (error) {
            console.error("Erreur lors de l'ajout de la récompense:", error);
            return false;
        }
    }

    static async removeReward(guildId, level, type, value) {
        try {
            await GuildRewards.findOneAndUpdate(
                { guildId },
                { 
                    $pull: { 
                        rewards: { 
                            level, 
                            type, 
                            value 
                        } 
                    } 
                }
            );
            return true;
        } catch (error) {
            console.error("Erreur lors de la suppression de la récompense:", error);
            return false;
        }
    }

    static async cleanExpiredMultipliers() {
        try {
            await GuildSettings.updateMany(
                { 'xpMultipliers.endDate': { $lt: new Date() } },
                { $set: { 'xpMultipliers.$.multiplier': 1.0 } }
            );
        } catch (error) {
            console.error('Erreur lors de la nettoyage des multiplicateurs expirés:', error);
        }
    }
}

module.exports = { LevelSystem };
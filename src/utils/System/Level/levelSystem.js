const Levels = require('../../Schemas/Level/Levels');
const fs = require('fs');
const path = require('path');

class LevelSystem {
    static async addXP(userId, guildId, xpToAdd, client) {
        try {
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
            const rewardsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../config/levelRewards.json'), 'utf8'));
            
            // Appliquer les rôles
            for (const reward of rewardsConfig.rewards) {
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
            if (rewardsConfig.permissions[newLevel]) {
                const member = await guild.members.fetch(userId);
                const permissions = rewardsConfig.permissions[newLevel];
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

    static async addReward(level, type, value, description) {
        try {
            const configPath = path.join(__dirname, '../../../config/levelRewards.json');
            const rewardsConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            rewardsConfig.rewards.push({ level, type, value, description });
            
            fs.writeFileSync(configPath, JSON.stringify(rewardsConfig, null, 2));
            return true;
        } catch (error) {
            console.error("Erreur lors de l'ajout de la récompense:", error);
            return false;
        }
    }

    static async removeReward(level, type, value) {
        try {
            const rewardsConfigPath = path.join(__dirname, '../../../config/levelRewards.json');
            const rewardsConfig = JSON.parse(fs.readFileSync(rewardsConfigPath, 'utf8'));
    
            rewardsConfig.rewards = rewardsConfig.rewards.filter(reward =>
                !(reward.level === level && reward.type === type && reward.value === value)
            );
    
            fs.writeFileSync(rewardsConfigPath, JSON.stringify(rewardsConfig, null, 2));
            return true;
        } catch (error) {
            console.error("Erreur lors de la suppression de la récompense :", error);
            return false;
        }
    }
    
}

module.exports = { LevelSystem };
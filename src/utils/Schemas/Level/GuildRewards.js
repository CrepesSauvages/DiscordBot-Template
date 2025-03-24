const mongoose = require('mongoose');

const guildRewardsSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    rewards: [{
        level: { type: Number, required: true },
        type: { type: String, required: true },
        value: { type: String, required: true },
        description: { type: String }
    }],
    permissions: {
        type: Map,
        of: [String]
    }
});

module.exports = mongoose.model('GuildRewards', guildRewardsSchema); 
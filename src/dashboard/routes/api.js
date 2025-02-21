const router = require('express').Router();
const { hasGuildPermission } = require('../middleware/auth');

router.get('/guilds', async (req, res) => {
    try {
        const guilds = req.user.guilds.filter(g => (g.permissions & 0x20) === 0x20);
        res.json(guilds);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/guild/:guildId/commands', hasGuildPermission, async (req, res) => {
    try {
        const commands = Array.from(req.app.client.commands.values())
            .map(cmd => ({
                name: cmd.data.name,
                description: cmd.data.description
            }));
        res.json(commands);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 
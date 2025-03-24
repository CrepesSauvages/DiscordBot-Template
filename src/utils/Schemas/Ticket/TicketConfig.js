const mongoose = require('mongoose');

const ticketCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  categoryChannel: { type: String, required: false },
  supportRoles: [{ type: String }],
  color: { type: String, default: '#0099ff' },
  emoji: { type: String, default: '🎫' }
});

const ticketConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  categories: [ticketCategorySchema],
  ticketCounter: { type: Number, default: 0 },
  archiveCategory: { type: String, default: null },
  logChannel: { type: String, default: null },
  welcomeMessage: { type: String, default: 'Merci d\'avoir ouvert un ticket. Un membre de notre équipe vous répondra bientôt.' }
});

module.exports = mongoose.model('TicketConfig', ticketConfigSchema);
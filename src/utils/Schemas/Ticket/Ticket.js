const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true, unique: true },
  ticketNumber: { type: Number, required: true },
  category: { type: String, required: true },
  ownerId: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed', 'archived'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
  participants: [{ type: String }]
});

module.exports = mongoose.model('Ticket', ticketSchema);
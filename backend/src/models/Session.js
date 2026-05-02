const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  skillExchanged: {
    teaching: { type: String, required: true },
    learning: { type: String, required: true },
  },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 }, // minutes
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  notes: { type: String, default: '' },
  recording: { type: String, default: '' }, // URL to recording
}, {
  timestamps: true,
});

sessionSchema.index({ participants: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);

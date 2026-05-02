const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 1000 },
}, {
  timestamps: true,
});

// Prevent duplicate reviews (one review per user per session)
reviewSchema.index({ sessionId: 1, reviewerId: 1 }, { unique: true });
reviewSchema.index({ revieweeId: 1 });

module.exports = mongoose.model('Review', reviewSchema);

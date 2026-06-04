const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  moduleId: {
    type: String,
    required: true,
  },
  jobCard: {
    type: String,
    required: true,
  },
  station: {
    type: String,
    required: true,
  },
  operatorName: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    default: '',
  },
  savedBy: {
    type: String,
    required: true,
  },
  savedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Scan', scanSchema);

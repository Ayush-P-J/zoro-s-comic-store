const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
    required: true,
  },
  transactions: [
    {
      type: {
        type: String,
        enum: ['credit', 'debit'],
      },
      amount: {
        type: Number,
      },
      description: {
        type: String,
        default: '',
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, { timestamps: true });

const Wallet = mongoose.model('wallet', walletSchema);
module.exports = {
    Wallet
}

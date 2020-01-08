const mongoose = require("mongoose");

const resettokenSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    resettoken: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now, expires: 43200 },
    });

module.exports = mongoose.model('ResetToken', resettokenSchema);

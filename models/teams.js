var mongoose = require("mongoose");

var TeamSchema = new mongoose.Schema({
    name: String,
    id: String,
    token: String,
    players: [
        {
            name: String,
            id: String,
            GeneralScore: Number
        }
    ]
});

module.exports = mongoose.model("Team", TeamSchema);
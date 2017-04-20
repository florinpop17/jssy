var mongoose = require("mongoose");

var GameSchema = new mongoose.Schema({
    questions: [],
    time: {type: Date, default: new Date()},
    creator: {name: String, slackid: String},
    teamid: String,
    channelid: String,
    qnumber: Number,
    players: [
        {
            
        }
    ]
});

module.exports = mongoose.model("Game", GameSchema);
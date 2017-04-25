var mongoose = require("mongoose");

var GameSchema = new mongoose.Schema({
    time: {type: Date, default: new Date()},
    teamid: String,
    channelid: String,
    token: String,
    players: [
        {
            name: String,
            id: String,
            points: Number,
            // pointsSplit: [{number: Number, time: Date}],
            answers: Number
        }
    ],
    currentQuestion: {
        question: String,
        answer: String,
        peopleAnswered: [{
            id: String,
            name: String
        }]
    }
});

module.exports = mongoose.model("Game", GameSchema);
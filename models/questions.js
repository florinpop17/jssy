var mongoose = require("mongoose");

var QuestionSchema = new mongoose.Schema({
    question: String,
    answer: String,
    time: Date,
    points: {type: Number, default: 100}
});

module.exports = mongoose.model("Question", QuestionSchema);
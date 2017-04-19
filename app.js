var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var port = process.env.PORT || 3000;

var score = 0;
var currentGame = {};
var questions = [
    {
        'id':1,
        'question':'If a = 30 and b = 50, what is the value of a + b = ?',
        'answer': '80'
    },
    {
        'id':2,
        'question':'What is the output of the following code: typeof true ?',
        'answer': 'boolean'
    },
    {
        'id':3,
        'question':'a = Math.pow(2,10). What is the value of a?',
        'answer': '1024'
    },
    {
        'id':4,
        'question':'a = true, b = false. What is the value of !b && a?',
        'answer': 'true'
    }
]

function getRandomQuestionId() {
    return Math.floor(Math.random() * questions.length);
}

// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/start', function (req, res) {
    console.log(req.body);

    currentGame = questions[getRandomQuestionId()];
    console.log('Current game is: ', currentGame);

    res.send('Starting the game... \n\n'+'Question: '+currentGame.question);
});

app.post('/ans', function (req, res) {
    var text = req.body.text;
    console.log(req.body);

    console.log('Current game is: ', currentGame);
    console.log('The user entered: ',text,' and the correct answer was: ',currentGame.answer);
    if(text === currentGame.answer){
        score += 100;
        currentGame = questions[getRandomQuestionId()];
        res.send('Congratulations! Your answer was correct!\n\n'+'The next question: '+currentGame.question);
    } else {
        currentGame = questions[getRandomQuestionId()];
        res.send('Wrong answer!\n\n'+'The next question: '+currentGame.question);
    }
});

app.post('/stop', function (req, res) {
    console.log(req.body);
    res.send('Game ended. You got '+score+' score.');
    score = 0;
});

app.listen(port, function () {
    console.log('Listening on port ' + port);
});

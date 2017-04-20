var express = require('express');
var bodyParser = require('body-parser');
var request = require("request");

//requireing the models for the database funcitonality
var Question = require("./models/questions");
var Game = require("./models/games");
var Team = require("./models/teams");

var mongoose = require("mongoose");

var app = express();
var port = process.env.PORT || 3000;

//checks if the database url is right
console.log(process.env.JSSYDATABASEURL);
var URL = process.env.JSSYDATABASEURL || "mongodb://localhost/JSSY";
mongoose.connect(URL);
mongoose.Promise = global.Promise;

var questions = [
    {
        'question':'If a = 30 and b = 50, what is the value of a + b = ?',
        'answer': '80',
        "time": new Date()
    },
    {
        'question':'What is the output of the following code: typeof true ?',
        'answer': 'boolean',
        "time": new Date()
    },
    {
        'question':'a = Math.pow(2,10). What is the value of a?',
        'answer': '1024',
        "time": new Date()
    },
    {
        'question':'a = true, b = false. What is the value of !b && a?',
        'answer': 'true',
        "time": new Date()
    }
]
// questions.forEach(function(question){
//     Question.create(question, function(error, question){
//         console.log(question);
//     });
// })


function getArrayOfRandomNumbers(max, len = 3){
    var result = [];
    if(max < len){
        for(var i=1; i<=max; i++){
            result.push(i);
        }
        len = max;
    }

    while(result.length < len){
        var newValue = Math.floor(Math.random() * max) + 1;
        if(result.indexOf(newValue) === -1){
            result.push(newValue);
        }
    }

    return result;
}

// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", function(req , res){
    res.send("You are on the home page.");
});

app.post('/start', function (req, res) {
    //console.log(req.body);


    // Currenty we only have these 4 questions
    // But we'll implement a getRandomQuestions function which will get a number of random questions out of the database
    var questions = [
        {
            'question':'If a = 30 and b = 50, what is the value of a + b = ?',
            'answer': '80',
            "time": new Date()
        },
        {
            'question':'What is the output of the following code: typeof true ?',
            'answer': 'boolean',
            "time": new Date()
        },
        {
            'question':'a = Math.pow(2,10). What is the value of a?',
            'answer': '1024',
            "time": new Date()
        },
        {
            'question':'a = true, b = false. What is the value of !b && a?',
            'answer': 'true',
            "time": new Date()
        }
    ];

    // Creating the properties of the new game
    var creator = {
        slackid: req.body.user_id,
        name: req.body.user_name
    }
    var teamid = req.body.team_id;
    var channelid = req.body.channel_id;
    var qnumber = questions.length;

    var newgame = {questions, creator, teamid, channelid, qnumber};

    // Variables for consol.log purposes in the server.
    var teamdomain = req.body.team_domain;
    var channelname = req.body.channel_name;

    Game.find({teamid: teamid, channelid: channelid}, function(err, games){
        //console.log("this is the game" + games);
        if(games.length === 0){
            Game.create(newgame, function(error, game){
                console.log(`Started game by ${creator.name} with id ${creator.slackid} in team ${teamdomain} and channel ${channelname} at ${new Date()}`);
                res.send('Starting game...');
            });
        } else {
            console.log(`User ${creator.name} with id ${creator.slackid} in team ${teamdomain} and channel ${channelname} tried to start a game while another game was already running at ${new Date()}.`);
            res.send("The game is already running!");
        }

    });

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

//SLACK AUTHENTICATION ROUTE THIS WILL BE USED FOR DISTRIBUTION AND FOR GETTING THE TOKEN.
//THIS URL IS CONFIGURED UNDER THE REDIRECT URL OF THE SLACK APP SETTINGS "OAUTH AND PERMISSIONS"

app.get("/slack/oauth", function(req, res){
    var data = {form: {
        client_id: process.env.JSSY_PORTAL_CLIENT_ID,
        client_secret: process.env.JSSY_PORTAL_CLIENT_SECRET,
        code: req.query.code
    }};
    // console.log(data);
    request.post('https://slack.com/api/oauth.access', data, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var token = JSON.parse(body).access_token;
            console.log(JSON.parse(body));
            request.post('https://slack.com/api/team.info', {form: {token: token}}, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(JSON.parse(body));
                    var teamid = JSON.parse(body).team.id;
                    var teamname = JSON.parse(body).team.name;
                    Team.find({name: teamname, id: teamid}, function(err, foundteam){
                        if(foundteam.length > 0 && foundteam){
                            return res.send("<h1>Another person from the team already added the app.</h1>");
                        }
                        Team.create({name: teamname, id: teamid, token: token}, function(err, newteam){
                            // console.log("this is a new team " + newteam);
                            res.redirect("https://" + JSON.parse(body).team.domain + ".slack.com/");
                        });
                    });
                } else {
                    return send("Don't worry it's not your fault. It's all mine. Try again please, if you wouldn't mind.");
                }
            });
        }
    });
});

app.listen(port, function () {
    console.log('Listening on port ' + port);
});

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

app.post("/message", function(req, res){
    Team.find({id: req.body.team_id}, function(err, team){
        console.log(team);
        
         request.post('https://slack.com/api/chat.postMessage', {form: {token: team[0].token, channel: req.body.channel_id, text: req.body.text}}, function (error, response, body) {
             
         });
         res.send("ok");
    })
});

app.post('/ans', function (req, res) {
    console.log(req.body);
    var teamid = req.body.team_id;
    var channelid = req.body.channel_id;
    var text = req.body.text;
    Game.find({teamid: teamid, channelid: channelid}, function(err, game){
        if(game.length > 0){
            console.log(game);
            if(game[0] === 0){

            }
        } else {
            res.send("A game hasn't started for this channel");
        }
    });
    
});

app.post('/stop', function (req, res) {
     Game.find({teamid: req.body.team_id, channelid: req.body.channel_id}, function(err, game){
        if(game.length > 0){
            Game.findByIdAndRemove(game[0]._id, function(err){
                res.send("Game deleted");
            });
        } else {
            res.send("A game hasn't started for this channel");
        }
    });
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
                            console.log("this is a new team " + newteam);
                            var teamdomain = JSON.parse(body).team.domain;
                            request.post('https://slack.com/api/channels.create', {form: {token: token, name: "Jssy-Game"}}, function (error, response, body) {
                                console.log("This is the new Channel" + body);
                                var channel = {};
                                channel.name =  JSON.parse(body).channel.name;
                                channel.id = JSON.parse(body).channel.id;
                                var game = {}
                                game.channelid = channel.id;
                                game.teamid = teamid;
                                game.time = new Date();
                                game.token = token;
                                game.currentQuestion = {};
                                Game.create(game, function(err, game){
                                    sendquestion(channel, token, res, game);
                                });
                            })
                        });
                    });
                } else {
                    return send("Don't worry it's not your fault. It's all mine. Try again please, if you wouldn't mind.");
                }
            });
        }
    });
});

function sendquestion(channel, token, res, game){
     Question.find({}).exec()
    .then(function(questions){
        console.log(questions);
        setInterval(function(){
            var randquest = questions[Math.round(questions.length * Math.random())];
            //we will send tha message afterwards I'll change it tomorrow;
            request.post('https://slack.com/api/chat.postMessage', {form: {token: token, channel: channel.id, text: randquest.question}}, function (error, response, body) {
                //before doing this we need to find the game and see if anyone has answered any questions. If they have then we show the people who have answered and their relative points.
                Game.find({channelid: channel.id, teamid: game.teamid}).exec()
                .then(function(game2){
                    console.log(game2);
                    if(game2.currentQuestion.peopleAnswered !== undefined){
                        if(game2.currentQuestion.peopleAnswered.length > 0){
                            
                        } else {

                        }
                    }
                })
                Game.findByIdAndUpdate(game._id, {currentQuestion: {question: randquest.question, answer: ransquest.answer}}, {new: true}).exec()
                .then(function(updatedgame){
                    console.log(updatedgame);
                });
            });
        }, 60000);
        res.redirect("https://" + teamdomain + ".slack.com/");
    });
}


//route to remove the channel from slack and from the database
app.post("/remove", function(req, res){
    Game.find({channelid: req.body.channel_id, teamid: req.body.team_id}).exec()
    .then(function(game){
        console.log(game);
        request.post('https://slack.com/api/channels.archive', {form: {token: game.token, channel: game.channelid}}, function (error, response, body) {
            Game.findByIdAndRemove(game._id, function(){
                res.send("Removed");
            });
        });
    });
})

app.listen(port, function () {
    console.log('Listening on port ' + port);
});

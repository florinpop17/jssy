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
var async = require("async");

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
    console.log(req.body);
    Team.find({id: req.body.team_id}, function(err, team){
        Game.find({teamid: req.body.team_id, channelid: req.body.channel_id}, function(error, game){
            sendquestion(team[0].token, game[0]);
            res.send("started");
        });
    })
});

app.post('/ans', function (req, res) {
    console.log(req.body);
    var teamid = req.body.team_id;
    var channelid = req.body.channel_id;
    var text = req.body.text;
    //FIND THE GAME
    // res.send("ok working");
    Game.find({teamid: teamid, channelid: channelid}).exec()
    .then(function(game){
        if(game.length > 0){
            var answer = game[0].currentQuestion.answer;
            console.log("answer " + answer + " text " + text);
            //Check if user has already answered that question
            var answered = game[0].currentQuestion.peopleAnswered;
            var ids = answered.map(function(el){return el.id});
            var index = ids.indexOf(req.body.user_id);
            if(index !== -1){
                res.send("You've already answered this question");
            } else {
                var players = game[0].players;
                var plids = players.map(function(el){return el.id});
                var plindex = plids.indexOf(req.body.user_id);
                if(plindex === -1){
                    var newplayer = {};
                    newplayer.name = req.body.user_name;
                    newplayer.id = req.body.user_id;
                    if(answer === text){
                        newplayer.points = 100;
                        newplayer.answers = 1;
                        res.send("Correct! Congratuations you just got 100 points :)");
                        answered.push({id: req.body.user_id, name: req.body.user_name});
                        players.push(newplayer);
                    } else {
                        newplayer.points = 0;
                        newplayer.answers = 0;
                        res.send("I'm sorry your answer was wrong");
                        players.push(newplayer);
                    }
                    
                } else {
                    var player = players[plindex];
                    if(answer === text){
                        player.points += 100;
                        player.answers ++;
                        res.send("Correct! Congratuations you just got 100 points :)");
                        answered.push({id: req.body.user_id, name: req.body.user_name});
                    } else {
                        res.send("I'm sorry your answer was wrong");
                    }
                    players[plindex] = player;
                }
                console.log("these are the answered now : " + answered);
                Game.findByIdAndUpdate(game[0]._id, {players: players, "currentQuestion.peopleAnswered": answered}, {new: true}).exec()
                .then(function(game){
                    console.log("updated game here: " + game);
                });
            }
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
    //using the data from above we're autheticating
    request.post('https://slack.com/api/oauth.access', data, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var token = JSON.parse(body).access_token;
            console.log(JSON.parse(body));
            //getting the info about the team that the user chose to authenticate
            request.post('https://slack.com/api/team.info', {form: {token: token}}, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(JSON.parse(body));
                    var teamid = JSON.parse(body).team.id;
                    var teamname = JSON.parse(body).team.name;
                    //finding the team to make sure that it isn't already there
                    Team.find({name: teamname, id: teamid}, function(err, foundteam){
                        if(foundteam.length > 0 && foundteam){
                            return res.send("<h1>Another person from the team already added the app.</h1>");
                        }
                        //if it isn't we create it in our database to save the token
                        Team.create({name: teamname, id: teamid, token: token}, function(err, newteam){
                            console.log("this is a new team " + newteam);
                            var teamdomain = JSON.parse(body).team.domain;
                            //we're creating the channel within this team
                            request.post('https://slack.com/api/channels.create', {form: {token: token, name: "JssyGame11"}}, function (error, response, body) {
                                console.log("This is the new Channel" + JSON.parse(body));
                                var game = {}
                                game.channelid = JSON.parse(body).channel.id;
                                game.teamid = teamid;
                                game.time = new Date();
                                game.token = token;
                                game.currentQuestion = {};
                                Game.create(game, function(err, game){
                                    sendquestion(token, game);
                                });
                                res.redirect("https://" + teamdomain + ".slack.com/");
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

function sendquestion(token, game){
    setInterval(function(){
        Question.find({}).exec()
        .then(function(questions){
            // console.log(questions);
            var randquest = questions[Math.floor(questions.length * Math.random())];
            console.log("this is the passed game" + game);
            console.log("and this is the randquestion" + randquest);
            Game.find({channelid: game.channelid, teamid: game.teamid}).exec()
            .then(function(game2){
                // console.log(game2[0]);
                if(game2[0].currentQuestion.peopleAnswered !== undefined){
                    if(game2[0].currentQuestion.peopleAnswered.length > 0){
                        var answered = game2[0].currentQuestion.peopleAnswered;
                        var names = answered.map(function(el){return el.name});
                        // var ids = answered.map(function (el){return el.id});
                        var message = "people who answered :" + names;
                        console.log("I'm in the field of shadows now !!!!!!!!!!!!!!!!!!!!!!!!!" + message);
                        sendmessage(game.channelid, token, message);
                    } else {
                        var message = "no one answered correctly the previous question";
                        sendmessage(game.channelid, token, message);
                    }
                    Game.findByIdAndUpdate(game._id, {currentQuestion: {question: randquest.question, answer: randquest.answer, peopleAnswered: []}}, {new: true}).exec()
                    .then(function(updatedgame){
                        console.log("updated game" + updatedgame);
                        var message = randquest.question;
                        sendmessage(game.channelid, token, message);
                    }).catch(function(err){
                        throw err;
                    });
                }
            }).catch(function(err){
                throw err;
            });
        }).catch(function(err){
            throw err;
        })
    }, 60000);
};

function sendmessage(channelid, token, text) {
    request.post('https://slack.com/api/chat.postMessage', {form: {token: token, channel: channelid, text: text}}, function (error, response, body) {
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
    })
});

app.listen(port, function () {
    console.log('Listening on port ' + port);
});

/**
 * Restify server
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, module, exports, console */

var restify = require('restify');
var mongoose = require('mongoose');
var Game = require('./models/game');
var Player = require('./models/player');
var constants = require('drum-circle-library/constants');

// TODO: Need different URL for development and production
mongoose.connect('mongodb://localhost/drum-circle');

// TODO: Only create open session if it doesn't exist
var openSession = new Game({ code: constants.OPEN_SESSION_CODE });
openSession.save();

var server = restify.createServer();
server.use(restify.CORS());
server.use(restify.fullResponse());

server.get('/games', function(req, res) {
    "use strict";
    Game.find(function(err, games) {
        res.send(games);
    });
});

server.post('/games', function(req, res) {
    "use strict";
    if (req.body) {
        var game = new Game(req.body);
        game.save();
        res.send(game);
    }
    else {
        res.send("Must pass settings.");
    }
});

server.get('/games/:code', function(req, res) {
    "use strict";
    var code = req.params.code;
    Game.findByCode(code, function(err, game) {
        if (game) {
            res.send(game);
        }
        else {
            res.send({ error: "Game " + code + "not found"});
        }
    });
});

server.get('/games/:code/players', function(req, res) {
    "use strict";
    Game.findByCode(req.params.code, function(err, game) {
        if (game) {
            Player.where({ game: game }).find(function(err, players) {
                res.send(players);
            });
        }
        else if (err) {
            res.send(err);
        }
    });
});

server.post('/games/:code/players', function(req, res) {
    "use strict";
    if (req.body) {
        Game.findByCode(req.params.code, function(err, game) {
            if (game) {
                var options = { game: game };
                var player = new Player(options);
                player.save();
                res.send(player);
            }
            else if (err) {
                res.send(err);
            }
        });
    }
    else {
        res.send("Must pass settings.");
    }
});

server.get('/time', function(req, res) {
    "use strict";
    res.json({
        time: new Date().getTime()
    });
});

module.exports = server;
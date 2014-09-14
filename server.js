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

createOpenSession();
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
        res.send(201, game);
    }
    else {
        res.send(400, "Must pass settings.");
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
            res.send(404, { error: "Game '" + code + "' not found"});
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
        else {
            res.send(404, { error: "Game '" + code + "' not found"});
        }
    });
});

server.post('/games/:code/players', function(req, res) {
    "use strict";
    var code = req.params.code;
    if (code) {
        Game.findByCode(code, function(err, game) {
            if (game) {
                var options = { game: game };
                var player = new Player(options);
                player.save();
                res.send(201, player);
            }
            else {
                res.send(404, { error: "Game '" + code + "' not found"});
            }
        });
    }
    else {
        res.send(400, "Must pass settings.");
    }
});

server.get('/time', function(req, res) {
    "use strict";
    res.json({
        time: new Date().getTime()
    });
});

function createOpenSession() {
    "use strict";
    Game.findByCode(constants.OPEN_SESSION_CODE, function (err, game) {
        if (!game) {
            var openSession = new Game({ code: constants.OPEN_SESSION_CODE });
            openSession.save();
        }
    });
}

module.exports = server;
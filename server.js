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
var Fanout = require('./services/fanout');

// TODO: Need different URL for development and production
mongoose.connect('mongodb://localhost/drum-circle');

createOpenSession();
var server = restify.createServer();
server.use(restify.CORS());
server.use(restify.fullResponse());
//server.use(restify.gzipResponse());
server.use(restify.bodyParser());

/**
 * Get games
 */
server.get('/games', function(req, res) {
    "use strict";
    Game.find(function(err, games) {
        res.send(games);
    });
});

/**
 * Create game
 */
server.post('/games', function(req, res) {
    "use strict";
    var code = req.params.code;
    if (code) {
        var game = new Game(req.params);
        game.save();
        res.send(201, game);
    }
    else {
        res.send(400, "Must pass settings.");
    }
});

/**
 * Get game
 */
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

/**
 * Get players in game
 */
server.get('/games/:code/players', function(req, res) {
    "use strict";
    var code = req.params.code;
    Game.findByCode(code, function(err, game) {
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

/**
 * Join a game
 */
server.post('/games/:code/players', function(req, res) {
    "use strict";
    var code = req.params.code;
    if (code) {
        Game.findByCode(code, function(err, game) {
            if (game) {
                var options = {
                    game: game,
                    color: req.params.color || game.getNextColor(),
                    drum: req.params.drum || game.getRandomDrum()
                };
                var player = new Player(options);
                player.save();
                player.getDetails(function(data) {
                    var event = constants.EVENTS.PLAYER_JOIN;
                    Fanout.send(code, event, data, function(result, response) {
                        if (response.statusCode < 300) {
                            res.send(201, player);
                        } else {
                            res.send(response.statusCode, result + " (Fanout)");
                        }
                    });
                });
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

/**
 * Send an effect to player
 */
server.post('/games/:code/:color/:effect', function(req, res) {
    "use strict";
    var code = req.params.code;
    var color = req.params.color;
    var effect = req.params.effect;
    if (code && color && effect) {
        Game.findByCode(code, function(err, game) {
            if (game) {
                var event = constants.EVENTS.EFFECT_RECEIVE;
                var data = { color: color, effect: effect };
                Fanout.send(code, event, data, function(result, response) {
                    if (response.statusCode < 300) {
                        res.send(204);
                    } else {
                        res.send(response.statusCode, result);
                    }
                });
            }
            else {
                res.send(404, { error: "Game '" + code + "' not found"});
            }
        });
    }
    else {
        res.send(400, "Must pass settings (code, color, effect)");
    }
});

/**
 * Get server time
 */
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
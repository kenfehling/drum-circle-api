/**
 * Restify server
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, module, exports, console */

var restify = require('restify');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var Game = require('./models/game');
var Player = require('./models/player');
var constants = require('drum-circle-library/constants');
var Fanout = require('./services/fanout');

// TODO: Need different URL for development and production
var connection = mongoose.connect('mongodb://localhost/drum-circle');

autoIncrement.initialize(connection);
Game.schema.plugin(autoIncrement.plugin, {
    model: 'Game',
    startAt: constants.OPEN_SESSION_CODE
});

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
    var game = new Game();
    game.save(function(err, game) {
        if (err) {
            res.send(500, err.message);
        }
        else {
            res.send(201, game);
        }
    });
});

/**
 * Set game settings
 */
server.patch('/games/:code', function(req, res) {
    "use strict";
    var code = req.params.code;
    Game.findByCode(code, function(err, game) {
        if (game) {
            game.tempo = req.params.tempo;
            game.drumKit = req.params.drum_kit;
            game.save(function(err, game) {
                if (err) {
                    res.send(500, err.message);
                }
                else {
                    res.send(game);
                }
            });
        }
        else {
            res.send(404, { error: "Game '" + code + "' not found"});
        }
    });
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

function getColor(game, req, callback) {
    "use strict";
    if (req.params.color) {
        callback(req.params.color);
    }
    else {
        game.getNextColor(callback);
    }
}

function getDrum(game, req, callback) {
    "use strict";
    if (req.params.drum) {
        callback(req.params.drum);
    }
    else {
        game.getRandomDrum(callback);
    }
}

/**
 * Join a game
 */
server.post('/games/:code/players', function(req, res) {
    "use strict";
    var code = req.params.code;
    if (code) {
        Game.findByCode(code, function(err, game) {
            if (game) {
                getColor(game, req, function(color)  {
                    getDrum(game, req, function(drum) {
                        var options = { game: game, color: color, drum: drum };
                        var player = new Player(options);
                        player.save(function(err, player) {
                            if (err) {
                                res.send(500, err.message);
                            }
                            else {
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
                        });
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
            openSession.save(function(err, game) {
                if (err) {
                    console.error(err.message);
                }
            });
        }
    });
}

module.exports = server;
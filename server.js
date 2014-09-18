/**
 * Restify server
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, module, exports, console */

var restify = require('restify');
var mongoose = require('mongoose');
var constants = require('drum-circle-library/constants');
var Fanout = require('./services/fanout');
var db = require('./services/database');

// TODO: Need different URL for development and production
db.connect('mongodb://localhost/drum-circle');

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
    db.models.Game.find(function(err, games) {
        res.send(games);
    });
});

/**
 * Create game
 */
server.post('/games', function(req, res) {
    "use strict";
    var game = new db.models.Game();
    game.save(function(err, game) {
        if (err) {
            res.send(500, err.toString());
        }
        else {
            res.send(201, game);
        }
    });
});

/**
 * Delete game
 */
server.del('games/:code', function(req, res) {
    "use strict";
    var code = req.params.code;
    db.models.Game.findOneAndRemove(code, function(err, game) {
        if (game) {
            res.send(game);
        }
        else {
            res.send(404, { error: "db.models.Game '" + code + "' not found"});
        }
    });
});

/**
 * Set game settings
 */
server.patch('/games/:code', function(req, res) {
    "use strict";
    var code = req.params.code;
    db.models.Game.findByCode(code, function(err, game) {
        if (game) {
            game.tempo = req.params.tempo;
            game.drum_kit = req.params.drum_kit;
            if (req.params.running) {
                game.running = req.params.running;
            }
            game.save(function(err, game) {
                if (err) {
                    res.send(500, err.toString());
                }
                else {
                    if (game.running) {
                        var event = constants.EVENTS.START_GAME;
                        Fanout.send(code, event, game, function(result, response) {
                            if (response.statusCode < 300) {
                                res.send(game);
                            } else {
                                res.send(response.statusCode, result + " (Fanout)");
                            }
                        });
                    }
                    else {
                        res.send(game);
                    }
                }
            });
        }
        else {
            res.send(404, { error: "db.models.Game '" + code + "' not found"});
        }
    });
});

/**
 * Get game
 */
server.get('/games/:code', function(req, res) {
    "use strict";
    var code = req.params.code;
    db.models.Game.findByCode(code, function(err, game) {
        if (game) {
            res.send(game);
        }
        else {
            res.send(404, { error: "db.models.Game '" + code + "' not found"});
        }
    });
});

/**
 * Get players in game
 */
server.get('/games/:code/players', function(req, res) {
    "use strict";
    var code = req.params.code;
    db.models.Game.findByCode(code, function(err, game) {
        if (game) {
            db.models.Player.where({ game: game }).find(function(err, players) {
                res.send(players);
            });
        }
        else {
            res.send(404, { error: "db.models.Game '" + code + "' not found"});
        }
    });
});

/**
 * Join a game
 */
server.post('/games/:code/players', function(req, res) {
    "use strict";
    if (req.params) {
        var code = req.params.code;
        db.models.Game.findByCode(code, function(err, game) {
            if (game) {
                getColor(game, req, function(err, color)  {
                    getDrum(game, req, function(err, drum) {
                        var options = {
                            game: game,
                            color: color,
                            drum: drum,
                            drum_kit: req.params.drum_kit || game.drum_kit,
                            tempo: req.params.tempo || game.tempo
                        };
                        var player = new db.models.Player(options);
                        player.save(function(err, player) {
                            if (err) {
                                res.send(500, err.toString());
                            }
                            else {
                                var event = constants.EVENTS.PLAYER_JOIN;
                                Fanout.send(code, event, player, function(result, response) {
                                    if (response.statusCode < 300) {
                                        res.send(201, player);
                                    } else {
                                        res.send(response.statusCode, result + " (Fanout)");
                                    }
                                });
                            }
                        });
                    });
                });
            }
            else {
                res.send(404, { error: "db.models.Game '" + code + "' not found"});
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
        db.models.Game.findByCode(code, function(err, game) {
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
                res.send(404, { error: "db.models.Game '" + code + "' not found"});
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

function getColor(game, req, callback) {
    "use strict";
    if (req.params.color) {
        callback(null, req.params.color);
    }
    else {
        game.getNextColor(callback);
    }
}

function getDrum(game, req, callback) {
    "use strict";
    if (req.params.drum) {
        callback(null, req.params.drum);
    }
    else {
        game.getRandomDrum(callback);
    }
}

function createOpenSession() {
    "use strict";
    db.models.Game.findByCode(constants.OPEN_SESSION_CODE, function (err, game) {
        if (!game) {
            var openSession = new db.models.Game({ code: constants.OPEN_SESSION_CODE });
            openSession.save(function(err, game) {
                if (err) {
                    console.error(err.toString());
                }
            });
        }
    });
}

module.exports = server;
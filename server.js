/**
 * Restify server
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, module, exports, console, process */

var _ = require('lodash');
var restify = require('restify');
var mongoose = require('mongoose');
var constants = require('drum-circle-library/constants');
var time_utils = require('drum-circle-library/time_utils');
var Fanout = require('./services/fanout');
var db = require('./services/database');

// Use different URL for development and production
if (process.env.MONGOHQ_URL) {
    db.connect(process.env.MONGOHQ_URL);
}
else {
    db.connect('mongodb://localhost/drum-circle');
}

var server = restify.createServer();
server.use(restify.CORS());
server.use(restify.fullResponse());
//server.use(restify.gzipResponse());
server.use(restify.bodyParser());

createOpenSession();

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
server.del('games/:_id', function(req, res) {
    "use strict";
    var _id = req.params._id;
    db.models.Game.findOneAndRemove(_id, function(err, game) {
        if (game) {
            res.send(game);
        }
        else {
            res.send(404, { error: "db.models.Game '" + _id + "' not found"});
        }
    });
});

/**
 * Set game settings
 */
server.patch('/games/:code', function(req, res) {
    "use strict";
    var _id = req.params.code;
    db.models.Game.findById(_id, function(err, game) {
        if (game) {
            setParamIfGiven(game, req, 'tempo');
            setParamIfGiven(game, req, 'drum_kit');
            if (req.params.running && !game.running) {
                game.running = req.params.running;
                game.start_time = time_utils.calculateNextCycleTime({
                    clientTime: new Date().getTime(),
                    timeDifference: 0,  // No difference because it's the server
                    beatDuration: 60000 / game.tempo,
                    beatsPerMeasure: 4,
                    measuresInCycle: 1
                });
            }
            game.save(function(err, game) {
                if (err) {
                    res.send(500, err.toString());
                }
                else {
                    if (game.running) {
                        var event = constants.EVENTS.GAME_STARTED;
                        fanout(res, _id, event, game);
                    }
                    else {
                        res.send(game);
                    }
                }
            });
        }
        else {
            res.send(404, { error: "Game '" + _id + "' not found"});
        }
    });
});

/**
 * Get game
 */
server.get('/games/:code', function(req, res) {
    "use strict";
    var _id = req.params.code;
    db.models.Game.findById(_id, function(err, game) {
        if (game) {
            res.send(game);
        }
        else {
            res.send(404, { error: "db.models.Game '" + _id + "' not found"});
        }
    });
});

/**
 * Get players in game
 */
server.get('/games/:code/players', function(req, res) {
    "use strict";
    var _id = req.params.code;
    db.models.Game.findById(_id, function(err, game) {
        if (game) {
            db.models.Player.where({ game: game }).find(function(err, players) {
                res.send(players);
            });
        }
        else {
            res.send(404, { error: "db.models.Game '" + _id + "' not found"});
        }
    });
});

/**
 * Join a game
 */
server.post('/games/:code/players', function(req, res) {
    "use strict";
    if (req.params) {
        var _id = req.params.code;
        db.models.Game.findById(_id, function(err, game) {
            if (game) {
                game.checkIfFull(function(err, full) {
                    if (err) {
                        res.send(400, err);
                    }
                    else {
                        if (full) {
                            res.send(403, { error: "Game is full" });
                        }
                        else {
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
                                    player.save(function (err, player) {
                                        if (err) {
                                            res.send(500, err.toString());
                                        }
                                        else {
                                            var event = constants.EVENTS.PLAYER_JOIN;
                                            fanout(res, _id, event, player, 201);
                                        }
                                    });
                                });
                            });
                        }
                    }
                });
            }
            else {
                res.send(404, { error: "Game '" + _id + "' not found"});
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
    var _id = req.params.code;
    var color = req.params.color;
    var effect = req.params.effect;
    if (_id && color && effect) {
        db.models.Game.findById(_id, function(err, game) {
            if (game) {
                var event = constants.EVENTS.EFFECT_RECEIVE;
                var data = { color: color, effect: effect };
                fanout(res, _id, event, data);
            }
            else {
                res.send(404, { error: "Game '" + _id + "' not found" });
            }
        });
    }
    else {
        res.send(400, "Must pass settings (_id, color, effect)");
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
        game.selectRandomDrum(callback);
    }
}

function createOpenSession() {
    "use strict";
    db.models.Game.findById(constants.OPEN_SESSION_CODE, function (err, game) {
        if (!game) {
            var openSession = new db.models.Game({
                _id: constants.OPEN_SESSION_CODE
            });
            openSession.save(function(err, game) {
                if (game) {
                    game.start_time = time_utils.calculateNextCycleTime({
                        clientTime: new Date().getTime(),
                        timeDifference: 0,  // No difference (it's the server)
                        beatDuration: 1000,
                        beatsPerMeasure: 4,
                        measuresInCycle: 1
                    });
                    game.save(function(err, game) {
                        if (err) {
                            console.error(err.toString());
                        }
                    });
                }
                else if (err) {
                    console.error(err.toString());
                }
            });
        }
    });
}

function fanout(res, channel, event, data, successCode) {
    "use strict";
    data = _.extend({ event: event }, data);
    Fanout.send(channel, event, data, function(result, response) {
        if (response.statusCode < 300) {
            res.send(successCode || 200, {});
        } else {
            res.send(response.statusCode, result);
        }
    });
}

function setParamIfGiven(game, req, paramName) {
    "use strict";
    if (req.params[paramName]) {
        game[paramName] = req.params[paramName];
    }
}

module.exports = server;
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
var utils = require('drum-circle-library/utils');
var time_utils = require('drum-circle-library/time_utils');
var Fanout = require('./services/fanout');
var db = require('./services/database');

// Use different URL for development and production
if (process.env.MONGODB_URI) {
    db.connect(process.env.MONGODB_URI);
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

function isOpenSession(_id) {
    /* jshint ignore:start */
    return _id == constants.OPEN_SESSION_CODE;
    /* jshint ignore:end */
}

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
            utils.copyParamIfDefined('tempo', req.params, game);
            utils.copyParamIfDefined('drum_kit', req.params, game);
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
                        var data = _.pick(game._doc, constants.PARAMS);
                        fanout(res, _id, event, data);
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

                if (isOpenSession(_id)) {
                    playerJoin(req, res, game);
                }
                else {
                    game.checkIfFull(function(err, full) {
                        if (err) {
                            res.send(400, err);
                        }
                        else {
                            if (full) {
                                res.send(403, { error: "Game is full" });
                            }
                            else {
                                playerJoin(req, res, game);
                            }
                        }
                    });
                }
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

    //TODO: Replace with a better check for production/development
    if (process.env.MONGOLAB_URI) {  // Production
        res.send(successCode || 200, data);  // Sends HTTP response first
        Fanout.send(channel, event, data, function (result, response) {
            if (response.statusCode >= 300) {
                console.error(result);
            }
        });
    }
    else {  // Development (and tests)
        Fanout.send(channel, event, data, function(result, response) {
            if (response.statusCode < 300) {
                res.send(successCode || 200, data);
            } else {
                res.send(response.statusCode, result);
            }
        });
    }
}

function playerJoin(req, res, game) {
    "use strict";
    getColor(game, req, function(err, color)  {
        getDrum(game, req, function(err, drum) {
            var options = {};
            options.game = game;
            options.color = color;
            options.drum = drum;
            utils.copyParamIfDefined('drum_kit', req.params, options);
            utils.copyParamIfDefined('tempo', req.params, options);
            var player = new db.models.Player(options);
            player.save(function (err, player) {
                if (err) {
                    res.send(500, err.toString());
                }
                else {
                    var event = constants.EVENTS.PLAYER_JOIN;
                    var data = _.pick(player._doc, constants.PARAMS);
                    fanout(res, game._id, event, data, 201);
                }
            });
        });
    });
}

module.exports = server;

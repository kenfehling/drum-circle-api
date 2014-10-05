/**
 * Mogoose game model
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, module, exports */

var mongoose = require('mongoose');
var _ = require('lodash');
var constants = require('drum-circle-library/constants');
var utils = require('drum-circle-library/utils');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
    _id: {
        type: Number,
        index: true,
        required: true,
        unique: true
    },
    running: {
        type: Boolean,
        required: true,
        default: false
    },
    start_time: Number,  // milliseconds since Jan 1, 1970
    drum_kit: Number,
    tempo: Number
});

gameSchema.methods.getNextColor = function(cb) {
    "use strict";
    this.getNumPlayers(function(err, num) {
        if (err) {
            cb(err);
        } else {
            cb(null, num % constants.MAX_PLAYERS);
        }
    });
};

gameSchema.methods.selectRandomDrum = function(cb) {
    "use strict";
    var game = this;
    this.getUnusedDrums(function(err, drums) {
        if (err) {
            cb(err);
        } else {
        if (drums.length === 0) {                            // If all are used
                drums = _.range(constants.NUM_DRUMS_IN_KIT); // pick any drum
            }
            cb(null, _.sample(drums));
        }
    });
};

gameSchema.methods.checkIfFull = function (cb) {
    "use strict";
    mongoose.models.Player.count({ game: this._id }, function(err, count) {
        cb(err, count >= constants.MAX_PLAYERS);
    });
};

gameSchema.methods.getNumPlayers = function (cb) {
    "use strict";
    mongoose.models.Player.count({ game: this._id }, cb);
};

gameSchema.methods.getUsedDrums = function (cb) {
    "use strict";
    mongoose.models.Player.find({ game: this._id }, function(err, players) {
        if (err) {
            cb(err);
        } else {
            cb(null, _.map(players, function (player) { return player.drum; }));
        }
    });
};

gameSchema.methods.getUnusedDrums = function (cb) {
    "use strict";
    this.getUsedDrums(function(err, used) {
        if (err) {
            cb(err);
        } else {
            cb(null, _.difference(_.range(constants.NUM_DRUMS_IN_KIT), used));
        }
    });
};

module.exports = mongoose.model('Game', gameSchema).model('Game');
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
    drum_kit: String,
    tempo: Number
});

gameSchema.methods.getNextColor = function(cb) {
    "use strict";
    this.getNumPlayers(function(err, num) {
        if (err) {
            cb(err);
        }
        else {
            cb(null, constants.PLAYER_COLORS[num % constants.MAX_PLAYERS]);
        }
    });
};

gameSchema.methods.selectRandomDrum = function(cb) {
    "use strict";
    var game = this;
    this.getUnusedDrums(function(err, drums) {
        if (err) {
            cb(err);
        }
        else {
            if (drums.length === 0) {                  // If all are used
                drums = getDrumKitObject(game).drums;  // just pick any of them
            }
            cb(null, _.sample(drums));
        }
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
        }
        else {
            cb(null, _.map(players, function (player) { return player.drum; }));
        }
    });
};

gameSchema.methods.getUnusedDrums = function (cb) {
    "use strict";
    var game = this;
    this.getUsedDrums(function(err, usedDrums) {
        if (err) {
            cb(err);
        }
        else {
            cb(null, _.difference(getDrumKitObject(game).drums, usedDrums));
        }
    });
};

function getDrumKitObject(game) {
    "use strict";
    var drumKitName = game.drum_kit || constants.DRUM_KITS[0].name;
    return _.findWhere(constants.DRUM_KITS, { name: drumKitName });
}

module.exports = mongoose.model('Game', gameSchema).model('Game');
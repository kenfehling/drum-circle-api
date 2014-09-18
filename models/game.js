/**
 * Mogoose game model
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, module, exports */

var mongoose = require('mongoose');
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

gameSchema.statics.findByCode = function (code, cb) {
    "use strict";
    this.findById(code, cb);
};

gameSchema.methods.getNextColor = function(cb) {
    "use strict";
    this.getNumPlayers(function(err, numPlayers) {
        cb(err, constants.PLAYER_COLORS[numPlayers % constants.MAX_PLAYERS]);
    });
};

gameSchema.methods.getRandomDrum = function(cb) {
    "use strict";
    cb(null, "kick");
};

gameSchema.methods.getNumPlayers = function (cb) {
    "use strict";
    mongoose.models.Player.count({ game: this._id }, cb);
};

module.exports = mongoose.model('Game', gameSchema).model('Game');
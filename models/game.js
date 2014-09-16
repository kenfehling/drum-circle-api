/**
 * Mogoose game model
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, module, exports */

var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var constants = require('drum-circle-library/constants');
var utils = require('drum-circle-library/utils');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
    drumKit: String,
    tempo: Number
});

gameSchema.statics.findByCode = function (code, cb) {
    "use strict";
    this.findById(code, cb);
};

gameSchema.methods.getDetails = function(cb) {
    "use strict";
    cb({ code: this._id, tempo: this.tempo, drumKit: this.drumKit });
};

gameSchema.methods.getNextColor = function(cb) {
    "use strict";
    this.getNumPlayers(function(numPlayers) {
        cb(constants.PLAYER_COLORS[numPlayers]);
    });
};

gameSchema.methods.getRandomDrum = function(cb) {
    "use strict";
    cb("kick");
};

gameSchema.methods.getNumPlayers = function (cb) {
    "use strict";
    cb(0);
};

module.exports = mongoose.model('Game', gameSchema).model('Game');
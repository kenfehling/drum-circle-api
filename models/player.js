/**
 * Mogoose player model
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, module, exports */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerSchema = new Schema({
    game: {
        type: Number,
        ref: 'games',
        index: true,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    drum: {
        type: String,
        required: true
    },
    drum_kit: String,
    tempo: Number
});

playerSchema.methods.getDetails = function(cb) {
    "use strict";
    cb({ color: this.color });
};

module.exports = mongoose.model('Player', playerSchema).model("Player");
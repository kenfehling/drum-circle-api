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
        type: Number,
        required: true
    },
    drum: Number,
    drum_kit: Number,
    tempo: Number
});

module.exports = mongoose.model('Player', playerSchema).model("Player");
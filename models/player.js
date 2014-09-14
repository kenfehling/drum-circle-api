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
        type: Schema.ObjectId,
        ref: 'games',
        index: true,
        required: true
    },
    color: String,
    drum: String,
    drumKit: String,
    tempo: Number
});

module.exports = mongoose.model('Player', playerSchema).model("Player");
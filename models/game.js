/**
 * Mogoose game model
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, module, exports */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
    code: {
        type: String,
        trim: true,
        index: true,
        required: true
    },
    drumKit: String,
    tempo: Number
});

gameSchema.statics.findByCode = function (code, cb) {
    this.findOne({ code: code }, cb);
};

gameSchema.methods.getNumPlayers = function (cb) {

};

module.exports = mongoose.model('Game', gameSchema).model('Game');
/**
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, module */

var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var constants = require('drum-circle-library/constants');
var Game = require('../models/game');
var Player = require('../models/player');

function connect(url) {
    "use strict";
    var connection = mongoose.connect(url);
    autoIncrement.initialize(connection);
    Game.schema.plugin(autoIncrement.plugin, {
        model: 'Game',
        startAt: constants.OPEN_SESSION_CODE
    });
}

function close() {
    "use strict";
    mongoose.disconnect();
}

module.exports = {
    connect: connect,
    close: close,
    models: {
        Game: Game,
        Player: Player
    }
};
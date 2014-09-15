/**
 * Unit tests for player model
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, describe, it */

var sinon = require('sinon');
var expect = require('chai').expect;
var mongoose = require('mongoose');
var Game = require('./../../models/Game');
var Player = require('./../../models/Player');
var PlayerModel = mongoose.model('Player');

describe('Player', function() {
    "use strict";
    it('returns details', function(done) {
        var game = new Game({ code: 'ABC' });
        var player = new Player({ color: 'blue', game: game });

        expect(player.getDetails(function(details) {
            expect(details).to.eql({
                color: 'blue'
            });
        }));
        done();
    });
});
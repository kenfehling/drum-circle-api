/**
 * Unit tests for game model
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, describe, it */

var sinon = require('sinon');
var expect = require('chai').expect;
var mongoose = require('mongoose');
var Game = require('./../../models/Game');
var GameModel = mongoose.model('Game');

describe('Game', function() {
    "use strict";
    it('creates a code', function(done) {
        // test setup
        var game = new Game();

        // asserting
        expect(game.code).to.not.be.undefined;

        // as our test is asynchronous, we have to tell mocha that it is finished
        done();
    });
});
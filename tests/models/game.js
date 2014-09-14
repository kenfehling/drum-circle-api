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

/*
describe('Game', function() {
    "use strict";
    it('#findByCode', function(done) {
        // test setup
        var games = [ 'game0', 'game1', 'game2' ];

        // mocking MongoDB
        sinon.stub(GameModel, 'findOne').yields(null, 'game1');

        // calling the test case
        Game.findByCode('game1', function(err, game) {

            // asserting
            expect(err).to.be.null;
            expect(game).to.eql('game1');

            // as our test is asynchronous, we have to tell mocha that it is finished
            done();
        });
    });
});
*/
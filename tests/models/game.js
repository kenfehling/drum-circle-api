/**
 * Unit test for Game model
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
    it('#findUnicorns', function(done) {
        // test setup
        var unicorns = [ 'unicorn1', 'unicorn2' ];
        var query = { world: '1' };

        // mocking MongoDB
        sinon.stub(GameModel, 'findByCode').yields(null, unicorns);

        // calling the test case
        Game.findByCode(query, function(err, game) {

            // asserting
            expect(err).to.be.null;
            expect(game).to.eql(['unicorn1-pink', 'unicorn2-purple']);

            // as our test is asynchronous, we have to tell mocha that it is finished
            done();
        });
    });
});
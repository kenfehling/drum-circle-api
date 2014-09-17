/**
 * Unit tests for game model
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, describe, it, before, after, beforeEach */

var sinon = require('sinon');
var expect = require('chai').expect;
var constants = require('drum-circle-library/constants');
var db = require('../../services/database');

describe('Game', function() {
    "use strict";

    before(function() {
        db.connect('mongodb://localhost/drum-circle');
    });

    after(function() {
        db.close();
    });

    it('creates a game successfully', function(done) {
        // test setup
        var game = new db.models.Game();
        game.save(function(err, game) {
            expect(err).to.be.null;
            expect(game).to.not.be.undefined;
            done();
        });
    });
});
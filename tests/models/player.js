/**
 * Unit tests for player model
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, describe, it, before, after, beforeEach */

var sinon = require('sinon');
var expect = require('chai').expect;
var db = require('../../services/database');

describe('Player', function() {
    "use strict";
    var game;

    before(function() {
        db.connect('mongodb://localhost/drum-circle');
    });

    after(function() {
        db.close();
    });

    beforeEach(function(done) {
        game = new db.models.Game();
        game.save(function(err, player) {
            expect(err).to.be.null;
            expect(player).to.not.be.undefined;
            done();
        });
    });

    it('should not save without a color', function(done) {
        var player = new db.models.Player({ game: game });
        player.save(function(err, player) {
            expect(err).to.not.be.null;
            expect(player).to.be.undefined;
            done();
        });
    });

    it('should save with a color and drum', function(done) {
        var player = new db.models.Player({
            game: game,
            color: 'red',
            drum: 'kick'
        });
        player.save(function(err, player) {
            expect(err).to.be.null;
            expect(player).to.not.be.undefined;
            done();
        });
    });

    it('returns details', function(done) {
        var player = new db.models.Player({ game: game, color: 'blue' });
        expect(player.getDetails(function(details) {
            expect(details).to.eql({
                color: 'blue'
            });
        }));
        done();
    });
});
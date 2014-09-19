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
    var game;

    before(function() {
        db.connect('mongodb://localhost/test');
    });

    after(function() {
        db.close();
    });

    beforeEach(function(done) {
        game = new db.models.Game();
        game.save(function(err, game) {
            expect(err).to.be.null;
            expect(game).to.not.be.undefined;
            done();
        });
    });

    it('gets zero players when nobody joined', function(done) {
        game.getNumPlayers(function(err, numPlayers) {
            expect(err).to.be.null;
            expect(numPlayers).to.not.be.undefined;
            expect(numPlayers).to.equal(0);
            done();
        });
    });

    it('gets one player when player has joined', function(done) {
        var player = new db.models.Player({
            game: game,
            color: constants.PLAYER_COLORS[0],
            drum: constants.DRUM_KITS[0].drums[0]
        });
        player.save(function(err, player) {
            expect(err).to.be.null;
            expect(player).to.not.be.undefined;
            game.getNumPlayers(function(err, numPlayers) {
                expect(numPlayers).to.equal(1);
                done();
            });
        });
    });

    it('gets a list of drums in use', function(done) {
        var player = new db.models.Player({
            game: game,
            color: constants.PLAYER_COLORS[0],
            drum: constants.DRUM_KITS[0].drums[0]
        });
        player.save(function(err, player) {
            expect(err).to.be.null;
            expect(player).to.not.be.undefined;
            game.getUsedDrums(function(err, drums) {
                expect(err).to.be.null;
                expect(drums.length).to.equal(1);
                expect(drums[0]).to.equal(constants.DRUM_KITS[0].drums[0]);
                done();
            });
        });
    });

    it('gets a list of drums not in use', function(done) {
        var player = new db.models.Player({
            game: game,
            color: constants.PLAYER_COLORS[0],
            drum: constants.DRUM_KITS[0].drums[0]
        });
        player.save(function(err, player) {
            expect(err).to.be.null;
            expect(player).to.not.be.undefined;
            game.getUnusedDrums(function(err, drums) {
                expect(err).to.be.null;
                expect(drums.length).to.equal(constants.DRUM_KITS[0].drums.length - 1);
                done();
            });
        });
    });

    it('selects a random drum', function(done) {
        game.selectRandomDrum(function(err, drum) {
            expect(err).to.be.null;
            expect(drum).to.not.be.null;
            done();
        });
    });
});
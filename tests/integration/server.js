/**
 * Integration tests for server
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, describe, it, before, beforeEach */

var hippie = require('hippie');
var server = require('../../server');
var constants = require('drum-circle-library/constants');
var TEST_GAME_CODE = 44;

describe('server', function () {
    "use strict";

    function createGame(callback) {
        hippie(server)
            .json()
            .post('/games')
            .expectStatus(201)
            .end(function(err, res, body) {
                callback(body._id);
            });
    }

    describe('/games endpoint', function () {
        it('creates a game', function (done) {
            createGame(function() {
                done();
            });
        });
    });
    describe('/games/:code endpoint', function () {
        var gameCode;
        beforeEach(function(done) {
            createGame(function(code) {
                gameCode = code;
                done();
            });
        });
        it('deletes a game', function (done) {
            hippie(server)
                .json()
                .del('/games/' + gameCode)
                .expectStatus(200)
                .end(done);
        });
        it('sets game settings', function (done) {
            hippie(server)
                .json()
                .patch('/games/' + gameCode)
                .send({ tempo: 60 })
                .expectStatus(200)
                .end(done);
        });
        it('does not set game settings if game does not exist', function (done) {
            hippie(server)
                .json()
                .patch('/games/blahhh')
                .send({ tempo: 60 })
                .expectStatus(404)
                .end(done);
        });
        it('returns a game based on the code', function (done) {
            hippie(server)
                .json()
                .get('/games/' + gameCode)
                .expectStatus(200)
                .end(done);
        });
        it('returns an error if game does not exist', function (done) {
            hippie(server)
                .json()
                .get('/games/blahhh')
                .expectStatus(404)
                .end(done);
        });
    });
    describe('/games/:code/players endpoint', function () {
        var gameCode;
        beforeEach(function(done) {
            createGame(function(code) {
                gameCode = code;
                done();
            });
        });
        it('adds a player if neccesary data is given', function (done) {
            hippie(server)
                .json()
                .post('/games/' + gameCode + '/players')
                .expectStatus(201)
                .end(done);
        });
        it('does not add a player if game does not exist', function (done) {
            hippie(server)
                .json()
                .post('/games/blahhh/players')
                .expectStatus(404)
                .end(done);
        });
    });
    describe('/games/:code/:color/:effect endpoint', function () {
        var gameCode;
        beforeEach(function(done) {
            createGame(function(code) {
                gameCode = code;
                done();
            });
        });
        it('sends an effect if neccesary data is given', function (done) {
            hippie(server)
                .json()
                .post('/games/' + gameCode + '/red/bitcrush')
                .expectStatus(204)
                .end(done);
        });
        it('does not send effect if game does not exist', function (done) {
            hippie(server)
                .json()
                .post('/games/blahhh/red/bitcrush')
                .expectStatus(404)
                .end(done);
        });
    });
});
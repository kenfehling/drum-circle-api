/**
 * Integration tests for server
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, describe, it, context, before, beforeEach */

var hippie = require('hippie');
var server = require('../../server');
var constants = require('drum-circle-library/constants');

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

    describe('/games/' + constants.OPEN_SESSION_CODE + ' endpoint', function() {
        it('returns open session game', function (done) {
            hippie(server)
                .json()
                .get('/games/' + constants.OPEN_SESSION_CODE)
                .expectStatus(200)
                .end(done);
        });
    });

    describe('/games/:code endpoint', function () {
        context('game exists', function() {
            var code;
            beforeEach(function(done) {
                createGame(function(c) {
                    code = c;
                    done();
                });
            });
            it('deletes a game', function (done) {
                hippie(server)
                    .json()
                    .del('/games/' + code)
                    .expectStatus(200)
                    .end(done);
            });
            it('sets game settings', function (done) {
                hippie(server)
                    .json()
                    .patch('/games/' + code)
                    .send({ tempo: 60 })
                    .expectStatus(200)
                    .end(done);
            });
            it('sets game settings and starts game', function (done) {
                hippie(server)
                    .json()
                    .patch('/games/' + code)
                    .send({ tempo: 60, running: true })
                    .expectStatus(200)
                    .end(done);
            });
            it('returns a game based on the code', function (done) {
                hippie(server)
                    .json()
                    .get('/games/' + code)
                    .expectStatus(200)
                    .end(done);
            });
        });
        context('game does not exist', function() {
            var code = 'blahhhh';
            it('returns an error', function (done) {
                hippie(server)
                    .json()
                    .get('/games/' + code)
                    .expectStatus(404)
                    .end(done);
            });
            it('does not set game settings', function (done) {
                hippie(server)
                    .json()
                    .patch('/games/' + code)
                    .send({ tempo: 60 })
                    .expectStatus(404)
                    .end(done);
            });
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
        context('game does not exist', function() {
            var code = 'blahhhh';
            it('does not add a player', function (done) {
                hippie(server)
                    .json()
                    .post('/games/' + code + '/players')
                    .expectStatus(404)
                    .end(done);
            });
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
                .expectStatus(200)
                .end(done);
        });
        context('game does not exist', function() {
            var code = 'blahhhh';
            it('does not send effect', function (done) {
                hippie(server)
                    .json()
                    .post('/games/' + code + '/red/bitcrush')
                    .expectStatus(404)
                    .end(done);
            });
        });
    });
});
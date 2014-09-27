/**
 * Integration tests for API server
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, describe, it, context, before, beforeEach */

var _ = require('lodash');
var hippie = require('hippie');
var expect = require('chai').expect;
var server = require('../../server');
var constants = require('drum-circle-library/constants');
var test_utils = require('drum-circle-library/test_utils');

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

    function fillGame(code, done) {
        var i = 0;
        function join() {
            hippie(server)
                .json()
                .post('/games/' + code + '/players')
                .expectStatus(201)
                .end(function() {
                    i += 1;
                    if (i >= constants.PLAYER_COLORS.length) {
                        done();
                    }
                    else {
                        join();
                    }
                });
        }
        join();
    }

    describe('/games endpoint', function () {
        it('creates a game', function (done) {
            createGame(function() {
                done();
            });
        });
    });

    describe('/games/' + constants.OPEN_SESSION_CODE + ' endpoint', function() {
        var code = constants.OPEN_SESSION_CODE;
        it('returns open session game', function (done) {
            hippie(server)
                .json()
                .get('/games/' + code)
                .expectStatus(200)
                .end(done);
        });
        context('game is full', function() {
            beforeEach(function(done) {
                fillGame(code, done);
            });
            it('joins anyway', function (done) {
                hippie(server)
                    .json()
                    .post('/games/' + code + '/players')
                    .expectStatus(201)
                    .end(done);
            });
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
            it('sets game settings and starts game', function (done) {
                hippie(server)
                    .json()
                    .patch('/games/' + code)
                    .send({
                        data: {
                            tempo: 60,
                            drum_kit: constants.DRUM_KITS[0].name,
                            running: 1
                        }
                    })
                    .expectStatus(200)
                    .end(done);
            });
            it('returns a game based on the code', function (done) {
                hippie(server)
                    .json()
                    .get('/games/' + code)
                    .expectStatus(200)
                    .end(function (err, res, body) {
                        expect(body._id).to.equal(code);
                        expect(body.running).to.be.false;
                        done();
                    });
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
        context('game exists', function() {
            var code;
            beforeEach(function(done) {
                createGame(function(c) {
                    code = c;
                    done();
                });
            });
            context('game is full', function() {
                beforeEach(function(done) {
                    fillGame(code, done);
                });
                it('returns an error', function (done) {
                    hippie(server)
                        .json()
                        .post('/games/' + code + '/players')
                        .expectStatus(403)
                        .end(done);
                });
            });

            it('adds a player', function (done) {
                hippie(server)
                    .json()
                    .post('/games/' + code + '/players')
                    .expectStatus(201)
                    .end(function (err, res, body) {
                        test_utils.exists(body.color);
                        test_utils.exists(body.drum);
                        done();
                    });
            });
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
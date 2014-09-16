/**
 * Integration tests for server
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, describe, it */

var hippie = require('hippie');
var server = require('../../server');

describe('server', function () {
    "use strict";
    describe('/games endpoint', function () {
        it('creates a game', function (done) {
            hippie(server)
                .json()
                .post('/games')
                .expectStatus(201)
                .end(done);
        });
    });
    describe('/games/:code endpoint', function () {
        it('sets game settings', function (done) {
            hippie(server)
                .json()
                .patch('/games/OPEN_SESSION')
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
                .get('/games/OPEN_SESSION')
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
        it('adds a player if neccesary data is given', function (done) {
            hippie(server)
                .json()
                .post('/games/OPEN_SESSION/players')
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
        it('sends an effect if neccesary data is given', function (done) {
            hippie(server)
                .json()
                .post('/games/OPEN_SESSION/red/bitcrush')
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
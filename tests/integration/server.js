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
});
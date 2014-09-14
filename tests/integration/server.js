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
    });
});
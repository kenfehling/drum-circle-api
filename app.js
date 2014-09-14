/**
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, console */

var server = require('./server');
var constants = require('drum-circle-library/constants');

server.listen(constants.DEFAULT_API_PORT, function() {
    "use strict";
    console.log('%s listening at %s', server.name, server.url);
});
/**
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, console, process */

var server = require('./server');
var constants = require('drum-circle-library/constants');

var port = process.env.PORT || constants.DEFAULT_API_PORT;
server.listen(port, function() {
    "use strict";
    console.log('%s listening at %s', server.name, server.url);
});
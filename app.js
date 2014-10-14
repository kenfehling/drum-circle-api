/**
 * The main node.js file
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, console, process */

require('newrelic');
var fs = require('fs');
var server = require('./server');
var constants = require('drum-circle-library/constants');

var port = process.env.PORT || constants.DEFAULT_API_PORT;
server.listen(port, function() {
    "use strict";
    console.log('%s listening at %s', server.name, server.url);
});

server.get('/favicon.ico', function(req, res, next) {
    "use strict";
    fs.readFile('./public/favicon.ico', function(err, file) {
        if (err) {
            res.send(500);
        }
        else {
            res.send({
                code: 200,
                noEnd: true
            });
            res.write(file);
            res.end();
        }
        return next();
    });
});
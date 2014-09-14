/**
 * Sends messages to Fanout.io
 * Author: Ken Fehling
 */

/*jshint strict: true */
/*global require, module, exports, Buffer */

var jwt = require('jwt-simple');
var rest = require('restler');

var BASE_URL = 'https://api.fanout.io/realm';
var REALM = '63969fc2';
var REALM_KEY = 'heQylo+nh4xBTuGiF4XuPg==';

function get_auth_token() {
    "use strict";
    var key = new Buffer(REALM_KEY, 'base64');
    var claim = { iss: REALM, exp: new Date().getTime() + 3600 };
    return jwt.encode(claim, key);
}

function send(channel, data, callback) {
    "use strict";
    var token = get_auth_token();
    var post = rest.postJson(BASE_URL + '/' + REALM + '/publish/' + channel + '/', {
        "items": [{ "fpp": data }]
        }, {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json",
                "Accept": "application/json"
        }
    });
    post.on('complete', function(result, response) {
        if (response.statusCode < 300) {
            callback({ message: result }, response);
        }
        else {
            callback({ error: result }, response);
        }
    });
}

module.exports = {
    send: send
};
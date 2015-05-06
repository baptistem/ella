var http = require("http");
var fs   = require("fs"); 
var request = require("request");

var userUrl = "http://hashweb.org/api/stats/users/";
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

function callStats(user, callback) {
    request(userUrl + user, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var response = JSON.parse(body)
            callback(response);
        }
    })
}

module.exports = {

    // Use the Hashweb API to get the last user seen
    getLastSeen: function(context, username) {
        callStats(username, function(data) {
            var msg = "";
            days = (data.userNotSeenFor.days) ? data.userNotSeenFor.days + " days " : "";
            hours = (data.userNotSeenFor.hours) ? data.userNotSeenFor.hours + " hours " : "";
            minutes = (data.userNotSeenFor.minutes) ? data.userNotSeenFor.minutes + " minutes" : "";
            msg = msg + data.username + " was last seen in #web " + days + hours + minutes + " ago: <" + data.username + "> " + data.lastSeen.message;
            context.channel.send_reply(context.sender, msg);
        });
    },

    // Use the config file to get the list of ops
    ops: function(context, username) {
        context.channel.send_reply(context.sender, config.ops.join(' '));
    }
}
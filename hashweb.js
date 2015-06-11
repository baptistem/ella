var http = require("http");
var fs   = require("fs"); 
var request = require("request");
var moment = require("moment");

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
    },

    getFirstSeen: function(context, username) {
        callStats(username, function(data) {
            var today = moment(),
                joinedDate = moment(data.firstSeen.timestamp),
                joinedDateString = joinedDate.format("dddd, MMMM Do YYYY");

            var msg = data.username + " was first seen here " + joinedDate.from(today) + " (" + joinedDateString + "): ";
            msg = msg + "<" + data.username + ">" + " " + data.firstSeen.message;

            context.channel.send_reply(context.sender, msg);
        });
    },

    modifyBansObject: function(context, bansText) {
        // TODO: make a isAuth? function
        for (var i=0;i < config.users.length ; i++) {
            if (config.users[i].host === context.host && channel) {
                bansText = bansText.trim();
                id = bansText.match(/^\d+/)[0]
                key = bansText.match(/\:(\w*)/)[1]
                value = bansText.match(/^\d+\:\w+\s(.+)/)[1]
                bansObject = {}

                if (key === "reason") {
                    bansObject.reason = value
                }

                if (key === "reminderTime") {
                    bansObject.reminderTime = value
                }
                request.post("http://hashweb.org/stats/bans/" + id, {form:bansObject}, function(err,httpResponse,body) {
                    context.channel.send_reply(context.sender, JSON.parse(body).message)
                });
            } else {
                context.channel.send_reply(context.sender, "Oops, looks like you're not authorized!");
            }
        }
    };
}
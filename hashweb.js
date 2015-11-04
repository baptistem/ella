var http = require("http");
var fs   = require("fs");
var request = require("request");
var moment = require("moment");

var userUrl = "http://192.168.1.16:8000/api/stats/users/";
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
var karmaUsers = [];

function callStats(user, callback) {
    request(userUrl + user, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var response = JSON.parse(body)
            callback(response);
        }
    })
}

function addKarma(user, callback) {
  request.post({url: 'http://192.168.1.16:8000/api/stats/users/'+ user +'/addkarma', form:{ username: user, points: 1 }}, callback)
}

function isAuth(host) {
    for (var i=0;i < config.users.length ; i++) {
        if (config.users[i].host === host) {
            return true
        }
    }
    return false;
}


// this will remove people from the karma list after a period of time
function karmaChecker() {
  console.log('KARMA CHECKER RUNNING');
  for (i in karmaUsers) {
    if ((new Date() - karmaUsers[i]) > 86400000) { // 24 hours
      console.log('removing ' + i);
      delete karmaUsers[i]; // remove them from the list so they can add karma again
    }
  }
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
        if (isAuth(context.intent.host)) {
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
    },

    updateBansList: function(context, bansText) {
        if (isAuth(context.intent.host)) {
            request.post("http://hashweb.org/stats/bans/update", function(err,httpResponse,body) {
               context.channel.send_reply(context.sender, JSON.parse(body).message);
            });
        } else {
            context.channel.send_reply(context.sender, "Oops, looks like you're not authorized!");
        }
    },

    giveKarma: function(context, user) {
      karmaChecker();
      if (user in karmaUsers) {
        context.channel.send_reply(context.sender, "Sorry, looks like you've already used your karma allowance for now, try again later");
        return;
      }
      addKarma(user, function(err, rsp, body) {
        var response = JSON.parse(body);
        response.statusCode = parseInt(response.statusCode);
        if (response.statusCode === 200) {
          context.channel.send_reply(context.sender, response.response);
          karmaUsers[user] = new Date(); // store the time when they added karma, we can use it later
        } else if (response.statusCode === 404) {
          context.channel.send_reply(context.sender, "oops, that user doesn't seem to exist right now");
        } else {
          context.channel.send_reply(context.sender, "oops, Karma service is down for now");
        }
      });
    },

    karma: function(context) {
      callStats(context.intent.name, function(data) {
            context.channel.send_reply(context.sender, "Your karma level is: " + data.karma);
        });
    },

    karmaLevel: function(context, user) {
      callStats(user, function(data) {
            context.channel.send_reply(context.sender, user + "'s karma level is: " + data.karma);
        });
    }

}

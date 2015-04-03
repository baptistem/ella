var http = require("http");
var fs   = require("fs"); 

var userUrl = "http://hashweb.org/api/stats/users/";
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

    function callStats(user, callback) {
    http.get(userUrl + user, function(res) {
    var body = '';

    res.on('data', function(chunk) {
        body += chunk;
    });

    res.on('end', function() {
        var response = JSON.parse(body)
        callback(response);
        });
    }).on('error', function(e) {
          console.log("Got error: ", e);
    });
}

module.exports = {

    // Use the Hashweb API to get the last user seen
    getLastSeen: function(context, username) {
        callStats(username, function(data) {
            context.channel.send_reply(context.sender, data.username + " was last seen " + data.userNotSeenFor.days + " days " + data.userNotSeenFor.hours + " hours " + data.userNotSeenFor.minutes + " minutes ago saying: " + data.lastSeen.message);
        });
    },

    // Use the config file to get the list of ops
    ops: function(context, username) {
        context.channel.send_reply(context.sender, config.ops.join(' '));
    }
}
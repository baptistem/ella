var Util = require("util");
var Bot = require("./lib/irc");
var fs = require("fs");

var YourBot = function(profile) {
	Bot.call(this, profile);
	this.set_log_level(this.LOG_ALL);
	this.set_trigger("!"); // Exclamation
};

Util.inherits(YourBot, Bot);

YourBot.prototype.init = function() {
	Bot.prototype.init.call(this);
	
	this.register_command("ping", this.ping);
	this.on('command_not_found', this.unrecognized);
};


YourBot.prototype.ping = function(cx, text) {
	cx.channel.send_reply (cx.sender, "Pong!");
};

YourBot.prototype.unrecognized = function(cx, text) {
	cx.channel.send_reply(cx.sender, "There is no command: "+text);
};

// config.json will be a hidden (gitignored) file for obvious reasons....
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
var profile = [{
	host: config.host,
	port: config.port,
	nick: config.nick,
	password: config.password,
	user: config.user,
	real: config.real,
	channels: config.channels
}];

(new YourBot(profile)).init();

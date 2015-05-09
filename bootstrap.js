var file = require('fs');
var path = require('path');
var util = require("util");
var http = require("http");
var fs   = require("fs");

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

var request = require("request");
var cheerio = require('cheerio');
var wolfram = require('wolfram-alpha').createClient(config.wolframAPI);

var Sandbox = require("./lib/sandbox");
var FactoidServer = require("./lib/factoidserv");
var FeelingLucky = require("./lib/feelinglucky");
var CanIUseServer = require("./lib/caniuse");
var hashwebAPI = require("./hashweb");


var Bot = require("./lib/irc");
var Shared = require("./shared");
// config.json will be a hidden (gitignored) file for obvious reasons....

var ddgAPi = "https://duckduckgo.com/?q=british%20broadcasting%20corporation&format=json";
var urlRegex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");


var JSBot = function(profile) {
	this.sandbox = new Sandbox(path.join(__dirname, "ecmabot-utils.js"));
	this.factoids = new FactoidServer(path.join(__dirname, "ecmabot-factoids.json"));
	this.caniuse_server = new CanIUseServer;
	this.executeRegex = /^((?:sm|v8|js|>>?|\|)>)([^>].*)+/;

	Bot.call(this, profile);
	this.set_log_level(this.LOG_ALL);
	this.set_trigger("!"); // Exclamation
};


util.inherits(JSBot, Bot);


JSBot.prototype.init = function() {
	var that = this;
	Bot.prototype.init.call(this);

	this.register_listener(this.executeRegex, Shared.execute_js);

	//this.register_listener(/^(\S+)(\+\+|--);?$/, this.do_beers);

	this.register_command("g", Shared.google, {
		help: "Run this command with a search query to return the first Google result. Usage: !g kitten images"});

	this.register_command("google", this.google, {
		help: "Returns a link to a Google search page of the search term. Usage: !google opencourseware computational complexity"});

	this.register_command("mdn", this.mdn, {
		help: "Search the Mozilla Developer Network. Usage: !mdn bitwise operators"});
	this.register_command("mdc", "mdn");

	this.register_command("ecma", this.ecma, {
		help: "Lookup a section from the ECMAScript spec. Usage: !ecma null value"});

	this.register_command("re", this.re, {
		help: "Usage: !re Your text here /expression/gi || FLAGS: (g: global match, i: ignore case)"});

	this.register_command("caniuse", this.caniuse, {
		help: "Search the caniuse.com database. Usage: !caniuse webgl"});
	this.register_command("ciu", "caniuse");

	this.register_command("find", Shared.find);

	this.register_command("help", this.help);

	this.register_command("auth", Shared.reauthenticate, {
		allow_intentions: false,
		help: "Attempt to re-authenticate with NickServ."});

	this.register_command("learn", Shared.learn, {
		allow_intentions: false,
		help: "Add factoid to bot. Usage: !learn ( [alias] foo = bar | foo =~ s/expression/replace/gi )"});

	this.register_command("forget", Shared.forget, {
		allow_intentions: false,
		help: "Remove factoid from bot. Usage: !forget foo"});

	this.register_command("commands", Shared.commands);

	this.register_command("ping", this.ping);

	this.register_command("dataja", this.dataja);

	this.register_command("seen", hashwebAPI.getLastSeen);

	this.register_command("ops", hashwebAPI.ops);

	this.register_command("ddg", this.ddg);

	this.register_command("beers", this.do_beers);

	this.register_command("calc", this.calc, {
		help: "Wolfram Alpha calculations. Usage !calc [query]"
	});

	this.on('command_not_found', this.command_not_found);

	this.on("pm", function(context, text) {
		channel = text.match(/^(\#[a-zA-Z0-9-]+)/);
		for (var i=0;i < config.users.length ; i++) {
			/* Check the config if its a valid user */
			if (config.users[i].host === context.host && channel) {
				channel = context.client.get_channel(channel);
				text = text.replace(/^(\#[a-zA-Z0-9-]+) /, "");
				channel.send(text.trim());
			}
		}
	});

	/* scan messages for links and print titles */
	this.on("message", function(context, text, msg) {
		channel = context.client.get_channel(context.name);
		/* request only deals with urls which begin with http(s) */
		if (msg.match(urlRegex) && msg.match(/^http[s]?/)) {
			/* Make request to URl and get the title */
			var url = msg.match(urlRegex)[0];
			request(url, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					$ = cheerio.load(body);
					var title = $("title").text();
					channel.send("Title: " + title);
				}
			});

		};
	});

	this.load_ecma_ref();

};


JSBot.prototype.ddg = function(context, text) {
	text = encodeURIComponent(text);
	request("https://duckduckgo.com/?q="+ text +"&format=json", function(error, response, body) {
	  if (!error && response.statusCode == 200) {
	  		try {
	  			body = JSON.parse(body);
	  			if (body.Abstract && body.Results && body.Results[0].FirstURL) {
	  				context.channel.send_reply(context.sender, body.Abstract + " : " + body.Results[0].FirstURL);
	  			}
	  			else if (body.Abstract) {
	  				context.channel.send_reply(context.sender, body.Abstract);
	  			}
	  			else if (body.AbstractURL) {
	  				context.channel.send_reply(context.sender, body.AbstractURL);
	  			}
	  			else {
	  				context.channel.send_reply(context.sender, " No results..sorry");
	  			}
	  		} catch(e) {
	  			 context.channel.send_reply(context.sender, " Oops looks like I couldn't parse the response from DDG")
	  		}
  		} else {
  			context.channel.send_reply(context.sender, " Oops looks like Duck Duck Go gave a bad response :(")
  		}
	});
}


JSBot.prototype.calc = function(context, text) {
	wolfram.query(text, function (err, result) {
  		if (err) throw err;
  		if (result.length >= 1 && ("subpods" in result[1])) {
 			context.channel.send_reply(context.sender, result[1].subpods[0].text);
 		} else {
 			context.channel.send_reply(context.sender, "Sorry, couldn't find a result for that :(");
 		}
	});
};

JSBot.prototype.google = function(context, text) {

	if (!text) {
		context.channel.send_reply (context.sender, this.get_command_help("google"));
		return;
	}

	context.channel.send_reply (context.intent, "Google search: \""+text+"\" <http://www.google.com/search?q="+encodeURIComponent(text)+">");
};

JSBot.prototype.there_is_no_try = function(context, text) {
	var hours = 1000*60*60;
	var now = +new Date();

	if (now > arguments.callee.last_invocation + 3*hours ||
		typeof arguments.callee.last_invocation === "undefined") {

		context.channel.send_reply(context.sender, "Do or do not; there is no try. --Yoda");
		arguments.callee.last_invocation = now;

	}
};

JSBot.prototype.ping = function(cx, text) {
	cx.channel.send_reply (cx.sender, "Pong!");
};


JSBot.prototype.do_beers = function(context, text, nick, operation) {
	/**
	 * /(\S+)\s*(?:(\+\+|--)|=\s*(?:\1)\s*(\+|-)\s*1);?/
	 * TODO: More advanced beer management
	 **/
	if (operation === "++") {
		if (nick.toLowerCase() !== "c") {
			context.channel.send_reply(context.sender, "Even if " + nick +
				" deserves any beer, I don't have any to spare.");
		} else {
			context.channel.send_reply(context.sender, "C doesn't deserve beer.");
		}
	} else {
		context.channel.send_action(
			"steals a beer a from " + nick + ", since we're taking 'em.");
	}
};


JSBot.prototype.re = function(context, msg) {
	// Okay first we need to check for the regex literal at the end
	// The regular expression to match a real js regex literal
	// is too long, so we need to use a simpler one.
	var regexmatches, regexliteral = /\/((?:[^\\\/]|\\.)*)\/([gi]*)$/;

	if (regexmatches = msg.match(regexliteral)) {
		try {
			var regexpobj = new RegExp(regexmatches[1], regexmatches[2]);
		} catch (e) {
			/* We have an invalid regular expression */
			context.channel.send_reply(context.sender, e.message);
			return;
		}

		var texttomatch = msg.slice(0, -regexmatches[0].length).trim();
		var result = texttomatch.match(regexpobj);
		if (result === null) {
			context.channel.send_reply(context.intent, "No matches found.");
			return;
		}

		var reply = [];
		for (var i = 0, len = result.length; i < len; i++) {
			reply.push(typeof result[i] !== "undefined" ?
				"'"+result[i]+"'" :
				"[undefined]");
		}

		context.channel.send_reply(context.intent, "Matches: "+reply.join(", "), {truncate: true});
	} else {
		context.channel.send_reply(context.sender, this.get_command_help("re"));
	}
};



JSBot.prototype.help = function(context, text) {

	try {
		if (!text) {
			return this.command_not_found (context, "help");
		}

		context.channel.send_reply(context.intent, this.get_command_help(text));
	} catch(e) {
		context.channel.send_reply(context.sender, e);
	}
};


JSBot.prototype.mdn = function(context, text, command) {
	if (!text) {
		return Shared.findPlus.call(this, context, command);
	}

	Shared.google (context, "site:developer.mozilla.org "+text);
};


JSBot.prototype.command_not_found = function(context, text) {
	Shared.findPlus.call(this, context, text, !context.priv);
};

// JSON.stringify([].slice.call(document.querySelectorAll('#toc-full a')).map(function(v) {return {title: v.firstChild.textContent, id: v.href.replace(/.+#/, '')};}));
// Use that to generate the required JSON from es5.github.io with Firefox

JSBot.prototype.ecma = function(context, text) {
	try {

	if (typeof this.ecma_ref === "undefined") {
		context.channel.send_reply(context.sender, "The ECMA-262 reference is not loaded.");
		return;
	}

	text = text.toLowerCase();
	var ref = this.ecma_ref, ch = text.charCodeAt(0);

	// If text begins with a number, the search must match at the beginning of the string
	var muststart = ch >= 48 && ch <= 57; 

	for (var i = 0, len = ref.length; i < len; i++) {
		var item = ref[i], title = item.title.toLowerCase();
		if (muststart ? title.substring(0, text.length) === text : ~title.indexOf(text)) {
			context.channel.send_reply(context.intent,
				"Found: " + item.title + " <http://es5.github.io/#" + item.id + ">");
			return;
		}
	}

	throw new Error("Could not find text '"+text+"' in the ECMAScript 5.1 Table of Contents.");

	} catch (e) { context.channel.send_reply(context.sender, e); }
};


JSBot.prototype.load_ecma_ref = function() {
	var filename = path.join(__dirname, "ecmabot-reference.json");
	util.puts("Loading ECMA-262 reference...");
	var bot = this;
	file.readFile(filename, function (err, data) {
		if (err) util.puts(util.inspect(err));
		try {
			bot.ecma_ref = JSON.parse(data);
		} catch (e) {
			util.puts("ECMA-262 Error: "+e.name+": "+e.message);
		}
	});
	if (typeof this.ecma_ref_watching === "undefined") {
		this.ecma_ref_watching = true;
		file.watchFile(filename, function (curr, prev) {
			util.puts("ECMA-262 reference file has changed.");
			bot.load_ecma_ref();
		});
	}
};

JSBot.prototype.caniuse = function(context, text) {
	try {
		var text = this.caniuse_server.search(text);
		context.channel.send_reply(context.intent, text, {color: true});
	} catch(e) {
		context.channel.send_reply(context.sender, e);
	}
};

JSBot.prototype.dataja = function(ctx, text) {
	ctx.channel.send(ctx.intent + " Don't ask to ask, just ask");
};

var profile = [{
	host: config.host,
	port: config.port,
	nick: config.nick,
	password: config.password,
	user: config.user,
	real: config.real,
	channels: config.channels
}];

(new JSBot(profile)).init();

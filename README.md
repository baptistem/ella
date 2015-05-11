Ella
========

Why Ella?, whats wrong with Natasha?
------
Time has come for us to re-think what our bot of the future is going to look like and how it will suit our needs.
Natasha (who was once called Olga) has done a great job over the years but we wish to change the infrastructure and how people can contribute.

Natasha has stored a whole heap of information (I think from 2011 onwards, maybe earlier) but we want to move logs and stats to the main database we already have running.

Here are our reasons for building a new bot:

* We want to seperate data from the bot, we now have a hashweb API (currently being used by [Hashweb Stats](http://stats.hashweb.org).
* Leaving things like logs and statistics to the main database means we can let the bot to make API calls and data comes from the same place. This also means we can open it up to the public (as its not directly communicating with a database)
* Development on Natasha is quite slow, as she is closed off with only 1 person maintaining her.  We don't want a single point of entry.
* We fancied using a new platform, the old bot was wrote in Python (a fork of limnoria) and does a great job. But if users are going to contribute we want a low barrier to entry, and thus decided Node JS was the best solution for that.
* I want to learn Node JS....
* By Moving to Github means we aremore open and users can view and learn about how the new bot will work.

### !commands
Retrieves a list of current commands.  
Usage: `!commands`

    <eboyjr> !commands
    <Ella> eboyjr: Valid commands are: !commands, !ecma, !find, !forget, !g, !google, !help, !learn, !mdc, !mdn, !re

### !ecma
Searches the ECMA-262 specification table of contents. Links to the section as found in http://es5.github.com/  
Usage: `!ecma <search text>`

    <eboyjr> !ecma null value
    <Ella> eboyjr: Found: 4.3.11 null value <http://es5.github.com/#x4.3.11>
    
    
### !calc
Do a calculation using Wolfram Alpha
Usage: `!calc 27 hex to dec`

    <eboyjr> !calc Prime Minister of England
    <Ella> eboyjr: David Cameron

### !find
Performs a search of a factoid in the database.  
Usage: `!find <factoid>`

    <eboyjr> !find frame
    <Ella> eboyjr: No factoid/command named `frame`. Did you mean: iframe, or cross-domain? See !commands for a list of commands.

### !forget
Removes a factoid from the database.  
Usage: `!forget <factoid>`

### !g
Returns the first Google result for the query.  
Usage: `!g <query>`

    <eboyjr> !g v8 javascript engine
    <Ella> eboyjr: v8 - V8 JavaScript Engine - Google Project Hosting <http://code.google.com/p/v8/>

### !google
Returns a link to a Google search page of the search term.  
Usage: `!google <query>`

    <eboyjr> !google opencourseware computational complexity
    <Ella> eboyjr: Google search: "opencourseware computational complexity" <http://www.google.com/search?q=opencourseware%20computational%20complexity>

### !ddg
Searches Duck Duck Go.
Usage: `!ddg <query>`

    <eboyjr> !ddg opencourseware computational complexity
    
### !help
Gives help for a specific command.  
Usage: `!help <command>`

    <eboyjr> !help help
    <Ella> eboyjr: No help for `help`

### !learn
Adds a factoid to the Ella. e
Usage: `!learn <factoid> = <text>`  
Usage: `!learn alias <factoid> = <factoid>`  
Usage: `!learn <factoid> =~ s/<expression>/<replace>/<flags>`

### !mdn
Searches the Mozilla Developer Network.  
Usage: `!mdn <query>`

    <eboyjr> !mdn bitwise operators
    <Ella> eboyjr: Bitwise Operators - MDN Docs <https://developer.mozilla.org/en/JavaScript/Reference/Operators/Bitwise_Operators>

### !re
Performs a regular expression match.  
Usage: `!re <your text here> /<expression>/<flags>`

    <eboyjr> !re Hannah Hannah Bo Banana, Fe Fi Fo Fana /.[an]+/g
    <Ella> eboyjr: Matches: 'Hanna', 'Hanna', 'Banana', 'Fana'
    
### !translate
Transtes a word from 1 language to another
Usage: `!translate [language] to [language] <text>`

    <eboyjr> !translate french to english bonjour
    <Ella> Good morning


## Factoids

The factoid system in bot is designed to store simple key/value pairs. Accessing a factoid from the database is as simple as:

    <eboyjr> !help
    <Ella> eboyjr: In order to get help, paste the relevant portions JavaScript in a pastebin (see !paste), and tell us 1) what you want to happen, 2) what is actually happening, and 3) any error messages you find (see !debug).

You can direct the responses of your command with the `@` character, followed by a nick.

    <phpman3000> HAI GUYS ... uh havin a bit of trubble with this script... i get TypeError: document.crateElenemt is not a function how do i fixx this??
    <eboyjr> !spelling @ phpman3000
    <Ella> phpman3000: Spelling and capitalization are important in programming, unless you are using PHP.
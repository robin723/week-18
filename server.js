/**
 * Created by lijasminej on 5/31/16.
 */

// DEPENDENCIES
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static('public'));

// DATABASE CONFIGURATION
// mongoose.connect('mongodb://localhost/mongoosescraper');

var uri = 'mongodb://username:password@ds021333.mlab.com:21333/heroku_86ns9zk0';
mongoose.connect(uri);

var db = mongoose.connection;

db.on('error', function (err) {
    console.log('Mongoose Error: ', err);
});
db.once('open', function () {
    console.log('Mongoose connection successful!');
});

// REQUIRE SCHEMAS
var Note = require('./models/Note.js');
var HistoricSite = require('./models/HistoricSite.js');

// SET UP ROUTES
app.get('/', function(req, res) {
    res.send(index.html);
});

app.get('/scrape', function(req, res) {

    // SET WEBSITE URL
    var mainURL = "http://www.vintagehudsonvalley.com/planner-historic-homes.shtml";

    // REQUEST TO SCRAPE DATA
    request(mainURL, function (error, response, html) {

        var $ = cheerio.load(html);
        var blocks = "";
        var results = [];

        // DEFINE PRIMARY UNIQUE SELECTOR
        var locator1 = 'h3';

        // DEFINE SECONDARY UNIQUE SELECTOR
        var locator2 = 'b';

        $(locator1).each(function(){

            // GETS FLOATING TEXT
            var block = $(this).siblings('span').text().trim();

            // STORE IN A STRING
            blocks = blocks + "\n" + block;

            $(this).siblings('span').children(locator2).each(function(){

                // SKIP IRRELEVANT ELEMENTS
                if ($(this).text() == $(this).parent().children(':first-child').text() &&
                    $(this).parent().siblings('h3').text().trim() == "") {

                    return true;

                } else {

                    var siteName = $(this).text().trim();
                    var siteLink = $(this).children('a').attr('href');

                    // BLANK FIELDS TO BE FILLED
                    var siteAdd = "";
                    var siteLoc = "";
                    var sitePhone = "";

                    // MAKE OBJECT
                    results.push({
                        name: siteName,
                        link: siteLink,
                        add: siteAdd,
                        loc: siteLoc,
                        phone: sitePhone
                    });
                }
            });
        });

        // REMOVE UNNECESSARY STUFF
        blocks = blocks.replace('"Frederic Church and My Friend Heather"', "");
        blocks = blocks.replace('by Rachel Dickinson', "");
        blocks = blocks.replace('"The Hudson Valley Hunk"', "");
        blocks = blocks.replace('by Judith Fein', "");

        // REMOVE EMPTY BLANK LINES
        blocks = blocks.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "");

        // EVERYTHING
        // console.log(blocks);
        // console.log(results);

        for (var i = 0; i < results.length; i++) {

            // HANDLE SPECIAL CHARACTERS
            if (results[i].name.indexOf("\'") >= 0) {
                results[i].name = results[i].name.replace("\'", "'");
                results[i].link = results[i].link.replace("\'", "'");
            } else if (results[i].name.indexOf("\n") >= 0) {
                if (results[i].name.indexOf(":") >= 0) {
                    results[i].name = results[i].name.replace(":", "");
                }
                results[i].name = results[i].name.replace("\n", ": ");
            }

            // console.log(results[i].name);
            // console.log(results[i].link);

            // GET THE REST OF THE DATA ...
            // console.log(i);

            // START IS THE END OF THE CURRENT ITEM
            // SET THE START OF SUBSTRING

            var startString = results[i].name.substr(results[i].name.length - 8,results[i].name.length);
            var startIndex = blocks.indexOf(startString) + 9;

            // IF NOT THE LAST ITEM
            if (i + 1 < results.length) {

                // END IS THE START OF THE NEXT ITEM
                var endString = results[i + 1].name.substr(0,5);
                // SET THE END OF SUBSTRING
                var endIndex = blocks.indexOf(endString);

                // AVOID REPEATS
                while ((endIndex - startIndex) > 200) {
                    startIndex = blocks.indexOf(startString, startIndex + 1) + 9;
                }
                while (endIndex < startIndex) {
                    endIndex = blocks.indexOf(endString, endIndex + 1)
                }

                populateData();
            }
            // IF THE LAST ITEM, GO TO THE END OF THE BLOCK
            else {

                // END IS THE END OF THE BLOCK
                var endString = blocks.substr(blocks.length - 5, blocks.length);
                // SET THE END OF SUBSTRING
                var endIndex = blocks.indexOf(endString);

                populateData();

            }

            // DEFINE THE FUNCTION TO FILL OUT THE REST OF THE DATA
            function populateData() {

                // IF THE STRING EXISTS IN THE BLOCK
                if (blocks.indexOf(startString) >= 0) {

                    // console.log(startString + ", " + startIndex);
                    // console.log(endString + ", " + endIndex);

                    var target = "";

                    // IF END OF THE BLOCK, DO NOT CUT OFF
                    if (endIndex + 5 == blocks.length) {
                        target = blocks.substr(startIndex,endIndex);
                    } else {
                        target = blocks.substr(startIndex,endIndex - startIndex);
                    }

                    // console.log("TARGET: " + target);
                    target = target.split("/");

                    // console.log(target[0]);
                    // console.log(target[1]);

                    siteAdd = target[0].trim().replace('\n',", ");
                    results[i].add = siteAdd;

                    var targetAfterSplit = target[1].split("\n");
                    siteLoc =  targetAfterSplit[0].trim();
                    results[i].loc = siteLoc;
                    sitePhone = targetAfterSplit[1];
                    results[i].phone = sitePhone;

                    console.log(results[i]);

                    // SAVE TO DATABASE

                    var entry = new HistoricSite(results[i]);
                    entry.save(function(err, doc) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(doc);
                        }
                    });

                }
            }
        }
    });

    // DISPLAY RESPONSE
    res.send("Scrape complete!");
});

app.get('/sites', function(req, res){
    HistoricSite.find({}, function(err, doc){
        if (err) {
            console.log(err);
        } else {
            res.json(doc);
        }
    });
});

app.get('/sites/:id', function(req, res){
    HistoricSite.findOne({'_id': req.params.id})
        .populate('note')
        .exec(function(err, doc){
            if (err){
                console.log(err);
            } else {
                res.json(doc);
            }
        });
});

app.post('/sites/:id', function(req, res){
    var newNote = new Note(req.body);

    newNote.save(function(err, doc){
        if(err){
            console.log(err);
        } else {
            HistoricSite.findOneAndUpdate({'_id': req.params.id}, {'note':doc._id})
                .exec(function(err, doc){
                    if (err){
                        console.log(err);
                    } else {
                        res.send(doc);
                    }
                });

        }
    });
});

app.listen(3000, function() {
    console.log('App running on port 3000!');
});
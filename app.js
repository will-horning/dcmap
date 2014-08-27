var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var config = require('./config');
var request = require('request');
var _ = require('lodash');
_.str = require('underscore.string');
var fs = require('fs');
var jade = require('jade');
var MongoClient = require('mongodb').MongoClient;

app.set('view engine', 'jade');

app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/', function(req, res){
	res.render('index.jade');
});

app.get('/sidebar', function(req, res){
    res.render('sidebar.jade');
});

app.get('/tweet_queue', function(req, res){
    MongoClient.connect(config.mongo.MONGOHQ_URL, function(err, db){
        if(err) console.log(err);
        var tweet_queue = db.collection('tweet_queue');
        tweet_queue.find({}, {limit: 10, sort: {created_at: -1}}).toArray(function(err, tweets){
            tweets = _.map(tweets, function(tweet){
                return {coordinates: tweet.coordinates, id_str: tweet.id_str};
            })
            res.json(tweets);
        });
    });
})

app.get('/instagram_queue', function(req, res){
    MongoClient.connect(config.mongo.MONGOHQ_URL, function(err, db){
        if(err) console.log(err);
        var instagram_queue = db.collection('instagram_queue');
        instagram_queue.find({}, {limit: 10, sort: {created_at: -1}}).toArray(function(err, instagrams){
            instagrams = _.map(instagrams, function(instagram){
                return {latlon: instagram.latlon, embed_url: instagram.embed_url};
            })
            res.json(instagrams);
        });
    });
})

var crime_template;
fs.readFile('views/crime_popup.jade', function(err, data){
    if(err) throw err;
    crime_template = jade.compile(data); 
});
app.get('/crime_queue', function(req, res){
    MongoClient.connect(config.mongo.MONGOHQ_URL, function(err, db){
        if(err) console.log(err);
        var crime_queue = db.collection('crimes');
        crime_queue.find({}, {limit:30, sort: {start_date: -1}}).toArray(function(err, crimes){
            crimes = _.map(crimes, function(crime){
                return {
                    popupContent: crime_template({crime: crime}),
                    lat: crime.lat,
                    lon: crime.lon,
                    offense: crime.offense
                }
            });
            res.json(crimes);
        });    
    });
})

var trains = require('./trains.js');
setInterval(function(){trains.moveEnrouteTrains(io);}, config.metro.ANIM_INTERVAL);
setInterval(trains.updateTrains, config.metro.PREDICTION_INTERVAL);

MongoClient.connect(config.mongo.MONGOHQ_URL, function(err, db){
    var twitter_stream = require('./twitter_stream.js')(io, db);
    var instagram_stream = require('./instagram_stream')(app, io, db);
})

http.listen(process.env.PORT || 5000, function(){
	console.log('Listening on *:' + process.env.PORT || 5000);
});
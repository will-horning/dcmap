var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var config = require('./config');
var request = require('request');
var _ = require('lodash');
_.str =require('underscore.string');
var fs = require('fs');
var jade = require('jade');
var MongoClient = require('mongodb').MongoClient;

var crime_template;
fs.readFile('views/crime_popup.jade', function(err, data){
    if(err) throw err;
    crime_template = jade.compile(data); 
});



// var FeedParser = require('feedparser');
// var request = require('request');

// var req = request(config.CRIME_FEED_URL);
// var feedparser = new FeedParser({});

// req.on('response', function(res){
//     var stream = this;
//     stream.pipe(feedparser);
// });

// var CONV_HOST = 'http://citizenatlas.dc.gov/';
// var SPS_CONV_URL = CONV_HOST + 'usng/getusng.asmx/MD_SPCStoLL?SPCSXYSTR=%s,%s';

// var atomToJSON = function(article, callback){
//     var json_article = {};
//     article = article['atom:content']['dcst:reportedcrime'];
//     _.forIn(article, function(value, key){
//         if(_.str.include(key, 'dcst:')){
//             json_article[key.replace('dcst:', '')] = value['#'];
//         }
//     });
//     var spc_x = json_article.blockxcoord;
//     var spc_y = json_article.blockycoord;
//     request(_.str.sprintf(SPS_CONV_URL, spc_x, spc_y), function(err, res, body){
//         var latlon = body.match(/<ConvStr>(.*?)<\/ConvStr>/)[1].split(',');
//         json_article.lat = latlon[0];
//         json_article.lon = latlon[1];
//         callback(json_article);
//     });
// };



app.set('view engine', 'jade');

app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/', function(req, res){
	res.render('index.jade');
});

app.get('/sidebar', function(req, res){
    res.render('sidebar.jade');
});

io.on('connection', function(socket){
    MongoClient.connect(config.mongo.MONGOHQ_URL, function(err, db){
        var tweet_queue = db.collection('tweet_queue');
        tweet_queue.find({}, {limit: 10, sort: {date: -1}}).toArray(function(err, tweets){
            socket.emit('tweet_queue', tweets);
        });
        var instagram_queue = db.collection('instagram_queue');
        instagram_queue.find({}, {limit: 10, sort: {date: -1}}).toArray(function(err, instagrams){
            socket.emit('instagram_queue', instagrams);    
        });
        var crime_queue = db.collection('crimes');
        crime_queue.find({}, {limit:30, sort: {start_date: -1}}).toArray(function(err, crimes){
            _.forEach(crimes, function(crime){
                crime.popupContent = crime_template({crime: crime});
                socket.emit('crime', crime);
            })
        })
    })
});






var twitter_stream = require('./twitter_stream.js')(io, db);
var instagram_stream = require('./instagram_stream')(app, io, db);

http.listen(process.env.PORT || 5000, function(){
	console.log('Listening on *:' + process.env.PORT || 5000);
});

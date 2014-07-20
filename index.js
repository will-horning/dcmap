var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var twitter_stream = require('./twitter_stream.js').createTwitterStream();
var classifyPoint = require('robust-point-in-polygon');
var config = require('./config');

twitter_stream.on('tweet', function(tweet){
    if(tweet['coordinates']){
    	var lonlat = tweet['coordinates']['coordinates'];
    	if(classifyPoint(config.dc_bounding_polygon, lonlat) < 1){
        	io.emit('tweet', tweet);
    	}
    }
});

app.set('view engine', 'jade');
app.use(express.static('public'));

app.get('/', function(req, res){
	res.render('index.jade');
});

http.listen(8000, function(){
	console.log('listening on *:8000');
});

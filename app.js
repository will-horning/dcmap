var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var twitter_stream = require('./twitter_stream.js').createTwitterStream();
var classifyPoint = require('robust-point-in-polygon');
var config = require('./config');
var Instagram = require('instagram-node-lib');

Instagram.set('client_id', config.instagram_client_id);
Instagram.set('client_secret', config.instagram_client_secret);
Instagram.set('callback_url', 'http://dcmap.herokuapp.com/callback');

Instagram.media.subscribe({lat: 38.99537317916349, lng: -77.0409607887268, radius: 1000})
// http.get('https://api.instagram.com/v1/subscriptions?client_secret=b863779087e4c2890052d150203afd9&client_id=7e86dca8cbd048369f6fd6de70e4d9c3', function(res){
//     console.log(res);
// })

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

app.get('/callback', function(req, res){
    console.log('----------------------------------');
    console.log(res);
    // io.emit('ig callback', res);
    // var handshake =  Instagram.subscriptions.handshake(req, res);
})

http.listen(process.env.PORT || 5000, function(){
	console.log('listening on *:' + process.env.PORT || 5000);
});

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
// var twitter_stream = require('./twitter_stream.js').createTwitterStream();
var classifyPoint = require('robust-point-in-polygon');
var config = require('./config');
var Instagram = require('instagram-node-lib');
var request = require('request');

Instagram.set('client_id', config.instagram_client_id);
Instagram.set('client_secret', config.instagram_client_secret);
Instagram.set('callback_url', 'http://dcmap.herokuapp.com/callback');

Instagram.media.subscribe({lat: 38.99537317916349, lng: -77.0409607887268, radius: 2500})
// http.get('https://api.instagram.com/v1/subscriptions?client_secret=b863779087e4c2890052d150203afd9&client_id=7e86dca8cbd048369f6fd6de70e4d9c3', function(res){
//     console.log(res);
// })

// twitter_stream.on('tweet', function(tweet){
//     if(tweet['coordinates']){
//     	var lonlat = tweet['coordinates']['coordinates'];
//     	if(classifyPoint(config.dc_bounding_polygon, lonlat) < 1){
//         	io.emit('tweet', tweet);
//     	}
//     }
// });

app.set('view engine', 'jade');
app.use(express.static('public'));
app.use(bodyParser());

app.get('/', function(req, res){
	res.render('index.jade');
});

app.get('/callback', function(req, res){
    console.log('----------------------------------');
    console.log(req.query['hub.challenge']);
    res.send(req.query['hub.challenge']);
    // io.emit('ig callback', res);
    // var handshake =  Instagram.subscriptions.handshake(req, res);
})
var i = 0;
app.post('/callback', function(req, res){
    console.log('===============================');
    io.emit('ig callback', req.body);
    var url = 'https://api.instagram.com/v1/geographies/' + req.body[0]['object_id'] + '/media/recent?client_id=' + config.instagram_client_id;
    request(url, function(err, res, body){
        io.emit('ig callback', url);
        io.emit('ig callback', body);
    })
    // io.emit('ig callback', req.body);
    if(i > 3000){
        Instagram.subscriptions.unsubscribe_all();
    }
    else{
        i += 1;
    }
})

http.listen(process.env.PORT || 5000, function(){
	console.log('listening on *:' + process.env.PORT || 5000);
});

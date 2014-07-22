var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var classifyPoint = require('robust-point-in-polygon');
var config = require('./config');
var request = require('request');
var Instagram = require('./instagram_stream')
var _ = require('lodash');
_.str =require('underscore.string');


// var Instagram.deleteInstagramSubs = function(callback){
//     var url = _.str.sprintf(
//         config.instagram.delete_subs,
//         config.instagram.client_secret,
//         config.instagram.client_id
//     );
//     request.del(url, function(err, res, body){
//         callback();
//     });
// };

// var Instagram.getInstagramSubs = function(callback){
//     var sub_data = {};
//     var url = _.str.sprintf(
//         config.instagram.get_subs,
//         config.instagram.client_secret,
//         config.instagram.client_id
//     );
//     request(url, function(err, res, body){
//         callback(JSON.parse(body));
//     });
// };

// Instagram.set('client_id', config.instagram.client_id);
// Instagram.set('client_secret', config.instagram.client_secret);
// console.log(config.instagram.client_id);
// console.log(config.instagram.client_secret);
// Instagram.set('callback_url', 'http://dcmap.herokuapp.com/callback');


// Instagram.getInstagramSubs(function(sub_status){
//     console.log('setting up subscriptions');
//     Instagram.deleteInstagramSubs(function(){
//         Instagram.media.subscribe({
//             lat: 38.99537317916349, 
//             lng: -77.0409607887268, 
//             radius: 5000
//         });
//     });
// });

app.set('view engine', 'jade');
app.use(express.static('public'));
app.use(bodyParser.json());


var twitter_stream = require('./twitter_stream.js').createTwitterStream();
twitter_stream.on('tweet', function(tweet){
    if(tweet.coordinates){
        var lonlat = tweet.coordinates.coordinates;
        if(classifyPoint(config.dc_bounding_polygon, lonlat) < 1){
            io.emit('tweet', tweet);
        }
    }
});

app.get('/getsubs', function(req, res){
    Instagram.getInstagramSubs(function(sub_status){
        res.send(sub_status);
    });
});

app.get('/delsubs', function(req, res){
    Instagram.deleteInstagramSubs(function(){
        Instagram.getInstagramSubs(function(sub_status){
            res.send(sub_status);
        });
    });
});

app.get('/', function(req, res){
	res.render('index.jade');
});

app.get('/callback', function(req, res){
    console.log('challenge received.');
    console.log(req.query['hub.challenge']);
    io.emit('console', req.query['hub challenge']);
    res.send(req.query['hub.challenge']);
});

app.post('/callback', function(req, res){
    console.log('callback received.');
    req.body[0].object_id
    var url = _.str.sprintf(
        config.instagram.photo_post_url, 
        config.instagram.client_id
    );
    request(url, function(err, res, body){
        var results = _.map(JSON.parse(body).data, function(ig_post){
            var lat = ig_post.location.latitude;
            var lon = ig_post.location.longitude;
            var post_url = ig_post.link.substring(5) + 'embed';        
            return [post_url, [lat, lon]];    
        });
        console.log('sending callback');
        io.emit('ig_callback', results);
    });
});

http.listen(process.env.PORT || 5000, function(){
	console.log('listening on *:' + process.env.PORT || 5000);
});

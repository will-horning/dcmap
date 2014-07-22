var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var classifyPoint = require('robust-point-in-polygon');
var config = require('./config');
var Instagram = require('instagram-node-lib');
var request = require('request');
var _ = require('lodash');
_.str =require('underscore.string');


var deleteInstagramSubs = function(callback){
    var url = _.str.sprintf(
        config.instagram.delete_subs,
        config.instagram.client_secret,
        config.instagram.client_id
    );
    request.del(url, function(err, res, body){
        callback();
    });
};

var getInstagramSubs = function(callback){
    var sub_data = {};
    var url = _.str.sprintf(
        config.instagram.get_subs,
        config.instagram.client_secret,
        config.instagram.client_id
    );
    request(url, function(err, res, body){
        callback(JSON.parse(body));
    });
};

Instagram.set('client_id', config.instagram.client_id);
Instagram.set('client_secret', config.instagram.client_secret);
Instagram.set('callback_url', 'http://dcmap.herokuapp.com/callback');


getInstagramSubs(function(sub_status){
    console.log('setting up subscriptions');
    deleteInstagramSubs(function(){
            Instagram.media.subscribe({
                lat: 38.99537317916349, 
                lng: -77.0409607887268, 
                radius: 5000
            });
        });
    // if(sub_status.data.length > 1){
    //     deleteInstagramSubs(function(){
    //         Instagram.media.subscribe({
    //             lat: 38.99537317916349, 
    //             lng: -77.0409607887268, 
    //             radius: 5000
    //         });
    //     });
    // }
    // else if(sub_status.data.length === 0){
    //     Instagram.media.subscribe({
    //         lat: 38.99537317916349, 
    //         lng: -77.0409607887268, 
    //         radius: 5000});
    // }
});

// var twitter_stream = require('./twitter_stream.js').createTwitterStream();
// twitter_stream.on('tweet', function(tweet){
//     if(tweet.coordinates){
//     	var lonlat = tweet.coordinates.coordinates;
//     	if(classifyPoint(config.dc_bounding_polygon, lonlat) < 1){
//         	io.emit('tweet', tweet);
//     	}
//     }
// });

app.set('view engine', 'jade');
app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/getsubs', function(req, res){
    getInstagramSubs(function(sub_status){
        res.send(sub_status);
    });
});

app.get('/delsubs', function(req, res){
    deleteInstagramSubs(function(){
        getInstagramSubs(function(sub_status){
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

var i = 0;
app.post('/callback', function(req, res){
    console.log('callback received.');
    var url = 'https://api.instagram.com/v1/geographies/' + req.body[0].object_id + '/media/recent?client_id=' + config.instagram_client_id;
    request(url, function(err, res, body){
        var results = _.map(JSON.parse(body).data, function(ig_post){
            var lat = ig_post.location.latitude;
            var lon = ig_post.location.longitude;
            var post_url = ig_post.link.substring(5) + 'embed';            
        });
        console.log('sending callback');
        io.emit('ig_callback', results);
    });
});

http.listen(process.env.PORT || 5000, function(){
	console.log('listening on *:' + process.env.PORT || 5000);
});

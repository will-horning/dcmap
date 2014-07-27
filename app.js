var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var config = require('./config');
var request = require('request');
var Instagram = require('./instagram_stream');
var _ = require('lodash');
_.str =require('underscore.string');

var instagram_links = [];

// Instagram.getInstagramSubs(function(sub_status){
//     console.log('setting up subscriptions');
//     Instagram.deleteInstagramSubs(function(){
//         Instagram.media.subscribe({
//             lat: config.instagram.CENTER_LAT, 
//             lng: config.instagram.CENTER_LON, 
//             radius: config.instagram.RADIUS
//         });
//     });
// });

app.set('view engine', 'jade');
app.use(express.static('public'));
app.use(bodyParser.json());


var twitter_stream = require('./twitter_stream.js').startTwitterStream(io);


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

// Instagram.startGeoSub(function(){
//     console.log('started instagram subscription');
// });

app.get('/instagram_callback', function(req, res){
    console.log('challenge received.');
    console.log(req.query['hub.challenge']);
    res.send(req.query['hub.challenge']);
});

app.post('/instagram_callback', function(req, res){
    console.log('callback received.');
    var url = _.str.sprintf(
        config.instagram.PHOTO_POST_URL, 
        req.body[0].object_id,
        config.instagram.CLIENT_ID
    );
    io.emit('igres', req.body);
    request(url, function(err, res, body){
        var results = _.map(JSON.parse(body).data, function(ig_post){
            var lat = ig_post.location.latitude;
            var lon = ig_post.location.longitude;
            var post_url = ig_post.link.substring(5) + 'embed';        
            return [post_url, [lat, lon]];    
        });
        results = _.filter(results, function(result){
            if(_.contains(instagram_links, result[0])){
                return false;
            }
            else{
                instagram_links.push(result[0]);
                return true;
            }
        });
        console.log('sending callback');
        io.emit('ig_callback', results);
    });
});

app.get('/test', function(req, res){
    res.render('test.jade');
});

http.listen(process.env.PORT || 5000, function(){
	console.log('listening on *:' + process.env.PORT || 5000);
});

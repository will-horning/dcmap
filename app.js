var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var config = require('./config');
var request = require('request');
var _ = require('lodash');
_.str =require('underscore.string');

app.set('view engine', 'jade');
app.use(express.static('public'));
app.use(bodyParser.json());



// app.get('/getsubs', function(req, res){
//     Instagram.getInstagramSubs(function(sub_status){
//         res.send(sub_status);
//     });
// });

// app.get('/delsubs', function(req, res){
//     Instagram.deleteInstagramSubs(function(){
//         Instagram.getInstagramSubs(function(sub_status){
//             res.send(sub_status);
//         });
//     });
// });

app.get('/', function(req, res){
	res.render('index.jade');
});

app.get('/sidebar', function(req, res){
    res.render('sidebar.jade');
});


var twitter_stream = require('./twitter_stream.js')(io);
var instagram_stream = require('./instagram_stream')(app, io);
// var Instagram = require('./instagram_stream');
// var instagram_links = [];

// Instagram.startGeoSub(function(){
//     console.log('started instagram subscription');
// });

// app.get('/instagram_callback', function(req, res){
//     res.send(req.query['hub.challenge']);
// });

// app.post('/instagram_callback', function(req, res){
//     var url = _.str.sprintf(
//         config.instagram.PHOTO_POST_URL, 
//         req.body[0].object_id,
//         config.instagram.CLIENT_ID
//     );
//     request(url, function(err, res, body){
//         var results = _.map(JSON.parse(body).data, function(ig_post){
//             var lat = ig_post.location.latitude;
//             var lon = ig_post.location.longitude;
//             var post_url = ig_post.link.substring(5) + 'embed';        
//             return [post_url, [lat, lon]];    
//         });
//         results = _.filter(results, function(result){
//             if(_.contains(instagram_links, result[0])){
//                 return false;
//             }
//             else{
//                 instagram_links.push(result[0]);
//                 return true;
//             }
//         });
//         io.emit('ig_callback', results);
//     });
// });

http.listen(process.env.PORT || 5000, function(){
	console.log('listening on *:' + process.env.PORT || 5000);
});

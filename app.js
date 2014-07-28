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

app.get('/', function(req, res){
	res.render('index.jade');
});

app.get('/sidebar', function(req, res){
    res.render('sidebar.jade');
});

var twitter_stream = require('./twitter_stream.js')(io);
var instagram_stream = require('./instagram_stream')(app, io);

http.listen(process.env.PORT || 5000, function(){
	console.log('Listening on *:' + process.env.PORT || 5000);
});

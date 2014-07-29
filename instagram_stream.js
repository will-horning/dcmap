var Instagram = require('instagram-node-lib');
var config = require('./config');
var request = require('request');
var _ = require('lodash');
_.str =require('underscore.string');


Instagram.set('client_id', config.instagram.CLIENT_ID);
Instagram.set('client_secret', config.instagram.CLIENT_SECRET);
Instagram.set('callback_url', config.instagram.CALLBACK_URL);

var addToQueue = function(db, new_instagram){
    var queue = db.get('instagram_queue');
    queue.insert(new_instagram, function(err, doc){
        queue.find({}, function(err, instagrams){
            if(instagrams.length > config.mongo.QUEUE_SIZE){
                var sorted_instagrams = _.sortBy(instagrams, function(ig){
                    return ig.created_time
                });
                queue.remove(sorted_tweets[0]);
            }
        })
    });
};

var deleteInstagramSubs = function(callback){
    var url = _.str.sprintf(
        config.instagram.DELETE_SUBS_URL,
        config.instagram.CLIENT_SECRET,
        config.instagram.CLIENT_ID
    );
    request.del(url, function(err, res, body){
        callback();
    });
};

var getInstagramSubs = function(callback){
    var sub_data = {};
    var url = _.str.sprintf(
        config.instagram.GET_SUBS_URL,
        config.instagram.CLIENT_SECRET,
        config.instagram.CLIENT_ID
    );
    request(url, function(err, res, body){
        callback(JSON.parse(body));
    });
};

var startGeoSub = function(callback){
    getInstagramSubs(function(sub_status){
        console.log('setting up subscriptions');
        deleteInstagramSubs(function(){
            console.log('starting new sub');
            Instagram.media.subscribe({
                lat: config.instagram.CENTER_LAT, 
                lng: config.instagram.CENTER_LON, 
                radius: config.instagram.RADIUS
            });
        });
    });    
};

module.exports = function(app, io, db){
    startGeoSub('/instagram_callback');
    var queue = db.get('instagram_queue');
    app.get('/instagram_callback', function(req, res){
        res.send(req.query['hub.challenge']);
    });
    var instagram_links = [];

    app.post('/instagram_callback', function(req, res){
        var url = _.str.sprintf(
            config.instagram.PHOTO_POST_URL, 
            req.body[0].object_id,
            config.instagram.CLIENT_ID
        );
        request(url, function(err, res, body){
            var results = _.map(JSON.parse(body).data, function(ig_post){
                var lat = ig_post.location.latitude;
                var lon = ig_post.location.longitude;
                var date = ig_post.created_time;
                var post_url = ig_post.link.substring(5) + 'embed';        
                return {post_url: post_url, latlon: [lat, lon], date: date};    
            });
            results = _.filter(results, function(result){
                if(_.contains(instagram_links, result.post_url)){
                    return false;
                }
                else{
                    instagram_links.push(result.post_url);
                    return true;
                }
            });
            if(results.length > 0){
                io.emit('instagram', results);
            }
        });
    });
};
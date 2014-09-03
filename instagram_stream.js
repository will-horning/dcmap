var Instagram = require('instagram-node-lib');
var config = require('./config');
var request = require('request');
var _ = require('lodash');
_.str =require('underscore.string');
var qs = require('qs');

Instagram.set('client_id', config.instagram.CLIENT_ID);
Instagram.set('client_secret', config.instagram.CLIENT_SECRET);
Instagram.set('callback_url', config.instagram.CALLBACK_URL);

var addToQueue = function(db, new_instagram){
    var queue = db.collection('instagram_queue');
    queue.insert(new_instagram, function(err, doc){
        if(err) throw err;
        // queue.find({}, function(err, instagrams){
        //     if(instagrams.length > config.mongo.QUEUE_SIZE){
        //         var sorted_instagrams = _.sortBy(instagrams, function(ig){
        //             return ig.date;
        //         });
        //         queue.remove(sorted_instagrams[0]);
        //     }
        // });
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
                var embed_url = ig_post.link.substring(5) + 'embed';        
                return {embed_url: embed_url, latlon: [lat, lon], date: date};    
            });
            results = _.filter(results, function(result){
                if(_.contains(instagram_links, result.embed_url)){
                    return false;
                }
                else{
                    instagram_links.push(result.embed_url);
                    return true;
                }
            });
            _.forEach(results, function(result){
                addToQueue(db, result);
            });
            if(results.length > 0){
                io.emit('instagram', results);
            }
        });
    });


    var url = 'https://api.instagram.com/v1/subscriptions/';
    var params = {
        client_id: config.instagram.CLIENT_ID,
        client_secret: config.instagram.CLIENT_SECRET,
        object: 'geography',
        aspect: 'media',
        lat: config.instagram.CENTER_LAT,
        lng: config.instagram.CENTER_LON,
        radius: config.instagram.RADIUS,
        callback_url: config.instagram.CALLBACK_URL
    };
    // url += qs.stringify(params);
    console.log(url);
    deleteInstagramSubs(function(){
        request.post({url: url, form: params}, function(err, res, body){
            console.log(body);
            if(err) throw err;
        });  
    });
};
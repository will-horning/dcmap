var Twitter = require('twit');
var config = require('./config');
var classifyPoint = require('robust-point-in-polygon');
var _ = require('lodash');

var addToQueue = function(db, new_tweet){
    var queue = db.collection('tweet_queue');
    queue.insert(new_tweet, function(err, doc){
        queue.find({}, function(err, tweets){
            if(tweets.length > config.mongo.QUEUE_SIZE){
                var sorted_tweets = _.sortBy(tweets, function(t){
                    return t.created_at
                });
                queue.remove(sorted_tweets[0]);
            }
        })
    });
};

module.exports = function(io, db){
    var T = new Twitter({
        consumer_key: config.twitter.CONSUMER_KEY,
        consumer_secret: config.twitter.CONSUMER_SECRET,
        access_token: config.twitter.ACCESS_TOKEN,
        access_token_secret: config.twitter.ACCESS_TOKEN_SECRET
    });

    var stream = T.stream('statuses/filter', {locations: config.DC_BOUNDING_BOX});
    stream.once('connected', function(r){
        console.log('Twitter stream connected.');
    });

    stream.on('reconnect', function(req, resp, interval){
        if(resp.statusCode == 420 || resp.statusCode == 406){
            stream.stop();
        }
        console.log('Twitter stream reconnecting: ', resp.statusCode);
    });    

    stream.on('tweet', function(tweet){
        if(tweet.coordinates){
            var lonlat = tweet.coordinates.coordinates;
            if(classifyPoint(config.DC_BOUNDING_POLYGON, lonlat) < 1){
                io.emit('tweet', tweet);
                addToQueue(db, tweet);
            }
        }
    });
    return stream;
};
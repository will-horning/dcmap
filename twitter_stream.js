var Twitter = require('twit');
var config = require('./config');
var classifyPoint = require('robust-point-in-polygon');
console.log(config.twitter);
var T = new Twitter({
    consumer_key: config.twitter.CONSUMER_KEY,
    consumer_secret: config.twitter.CONSUMER_SECRET,
    access_token: config.twitter.ACCESS_TOKEN,
    access_token_secret: config.twitter.ACCESS_TOKEN_SECRET
});

module.exports = {
    startTwitterStream: function(io){
        var stream = T.stream('statuses/filter', {locations: config.DC_BOUNDING_BOX})
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
                }
            }
        });
        return stream;
    }
}
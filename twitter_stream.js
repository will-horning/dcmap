var Twitter = require('twit');
var config = require('./config');

var T = new Twitter({
    consumer_key: config.twitter_api.consumer_key,
    consumer_secret: config.twitter_api.consumer_secret,
    access_token: config.twitter_api.access_token,
    access_token_secret: config.twitter_api.access_token_secret
});

module.exports = {
    createTwitterStream: function(){
        var stream = T.stream('statuses/filter', {locations: config.dc_bounding_box})
        stream.once('connected', function(r){
            console.log('Twitter stream connected.');
        });

        stream.on('reconnect', function(req, resp, interval){
            if(resp.statusCode == 420 || resp.statusCode == 406){
                stream.stop();
            }
            console.log('Twitter stream reconnecting: ', resp.statusCode);
        });    
        return stream;
    }
}
var Instagram = require('instagram-node-lib');
var config = require('./config');
var request = require('request');
var _ = require('lodash');
_.str =require('underscore.string');


Instagram.set('client_id', config.instagram.CLIENT_ID);
Instagram.set('client_secret', config.instagram.CLIENT_SECRET);
console.log(config.instagram.CLIENT_ID);
console.log(config.instagram.CLIENT_SECRET);
Instagram.set('callback_url', config.instagram.CALLBACK_URL);

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
            Instagram.media.subscribe({
                lat: config.instagram.CENTER_LAT, 
                lng: config.instagram.CENTER_LON, 
                radius: config.instagram.RADIUS
            });
        });
    });    
}

module.exports = {
    instagramStream: Instagram,
    startGeoSub: startGeoSub,
    deleteInstagramSubs: deleteInstagramSubs,
    getInstagramSubs: getInstagramSubs
};
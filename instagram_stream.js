var Instagram = require('instagram-node-lib');
var config = require('./config');
var request = require('request');
var _ = require('lodash');
_.str =require('underscore.string');


Instagram.set('client_id', config.instagram.client_id);
Instagram.set('client_secret', config.instagram.client_secret);
console.log(config.instagram.client_id);
console.log(config.instagram.client_secret);
Instagram.set('callback_url', 'http://dcmap.herokuapp.com/instagram_callback');

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

var startGeoSub = function(callback){
    getInstagramSubs(function(sub_status){
        console.log('setting up subscriptions');
        deleteInstagramSubs(function(){
            Instagram.media.subscribe({
                lat: 38.90538244174961, 
                lng: -77.0416259765625, 
                radius: 5000
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
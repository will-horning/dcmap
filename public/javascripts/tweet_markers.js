var _ = require('lodash');
var config = require('./client_config');
_.str = require('underscore.string');
var base_markers = require('./base_markers');

var tweetIcon = L.divIcon({
    className: 'markericon',
    iconAnchor: [12, 12],
    html: _.str.sprintf('<img style="width:24px;" src="%s">', config.twitter.ICON_PATH)
});

var tweetPopupContent = '<div class="tweetPopup" ' +
    'style="width:510px;align=center;" id="%s"></div>';

var addMarker = function(tweet, map){
    var latlon = [
        tweet.coordinates.coordinates[1],
        tweet.coordinates.coordinates[0]
    ];
    base_markers.addCircleMarker(map, latlon);
    var popup = L.popup({
        maxWidth: 600,
        maxHeight: 300,
        className: 'myPopup'
    }).setContent(_.str.sprintf(tweetPopupContent, tweet.id_str));
    return new base_markers.FadeMarker(latlon, {icon: tweetIcon}).bindPopup(popup);
};

module.exports = {
    addMarker: addMarker
};


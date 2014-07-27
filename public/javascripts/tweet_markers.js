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

var addMarker = function(tweet, map, markerQueue){
    if(markerQueue.length > 30){
        map.removeLayer(markerQueue.shift());
    }
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
    var marker = new base_markers.FadeMarker(latlon, {icon: tweetIcon}).bindPopup(popup);
    markerQueue.push(marker);
    return marker;
    // setTimeout(function(){
    //     map.removeLayer(marker);
    // }, 3000);
    // var marker = L.marker(latlon, {icon: tweetIcon}
    //     ).bindPopup(mypopup).addTo(map);
};

module.exports = {
    addMarker: addMarker
};
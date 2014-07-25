var _ = require('lodash');
var config = require('./client_config');
_.str = require('underscore.string');
var addCircleMarker = require('./tweet_markers').addCircleMarker;

var instagramIcon = L.divIcon({
    className: 'markericon',
    iconAnchor: [12, 12],
    html: _.str.sprintf('<img style="width:24px;" src="%s">', config.instagram.iconPath)
});

var addMarker = function(iframe, map, latlon, markerQueue){
        addCircleMarker(map, latlon);
        var mypopup = L.popup({
            maxWidth: 600,
            maxHeight: 800,
            className: 'myPopup'
        }).setContent('<div class="instagramPopup" style="width:500px;"><iframe style="width:500px;height:630px;" src="' + iframe + '"></iframe></div>');
        if(markerQueue.length > config.markerQueueSize){
            map.removeLayer(markerQueue.shift());
        }
        var marker = L.marker(
            latlon, 
            {icon: instagramIcon}
        ).bindPopup(mypopup).addTo(map);
        markerQueue.push(marker);
};

module.exports = {
    addMarker: addMarker
}
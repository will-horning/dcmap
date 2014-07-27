var _ = require('lodash');
var config = require('./client_config');
_.str = require('underscore.string');
var base_markers = require('./base_markers');

var instagramIcon = L.divIcon({
    className: 'markericon',
    iconAnchor: [12, 12],
    html: _.str.sprintf('<img style="width:24px;" src="%s">', config.instagram.ICON_PATH)
});

var popupContent = '<div class="instagramPopup" style="width:px;">' + 
    '<iframe style="width:500px;height:630px;" src="%s"></iframe></div>';

var addMarker = function(iframe_src, map, latlon, markerQueue){
        base_markers.addCircleMarker(map, latlon);
        var mypopup = L.popup({
            maxWidth: 600,
            maxHeight: 800,
            className: 'myPopup'
        }).setContent(_.str.sprintf(popupContent, iframe_src));
        if(markerQueue.length > config.MARKER_QUEUE_SIDE){
            map.removeLayer(markerQueue.shift());
        }
        var marker = new base_markers.FadeMarker(
            latlon,
            {icon: instagramIcon
        }).bindPopup(mypopup).addTo(map);
        // var marker = L.marker(
        //     latlon, 
        //     {icon: instagramIcon}
        // ).bindPopup(mypopup).addTo(map);
        markerQueue.push(marker);
};

module.exports = {
    addMarker: addMarker
}
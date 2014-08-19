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
    '<iframe style="width:500px;height:630px;" frameBorder=0 src="%s"></iframe></div>';

var addMarker = function(ig_post, map, markerQueue){
        base_markers.addCircleMarker(map, ig_post.latlon);
        var popup = L.popup({
            maxWidth: 600,
            maxHeight: 800,
            className: 'myPopup'
        }).setContent(_.str.sprintf(popupContent, ig_post.embed_url));
        return new base_markers.FadeMarker(
            ig_post.latlon,
            {icon: instagramIcon
        }).bindPopup(popup);
};

module.exports = {
    addMarker: addMarker
}
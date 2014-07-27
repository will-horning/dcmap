var _ = require('lodash');
_.str = require('underscore.string');

var oldOnAdd = L.Marker.prototype.onAdd;
var oldOnRemove = L.Marker.prototype.onRemove;

module.exports = {
    addCircleMarker: function(map, latlon){
        var circle_marker = L.marker(
            latlon, 
            {icon: L.divIcon({
                className: 'circleMarker',
                iconAnchor: [24, 24],
                iconSize: [48,48]
        })}).addTo(map);
        setTimeout(function() {map.removeLayer(circle_marker);}, 2000);
    },
    
    FadeMarker: L.Marker.extend({
        onAdd: function(map){
            L.Marker.prototype.onAdd.call(this, map);
            $(this._icon).removeClass('fadeOut').addClass('fadeIn');
            $(this._icon).css('opacity', 1);
        },
        onRemove: function(map){
            $(this._icon).removeClass('fadeIn').addClass('fadeOut');
            $(this._icon).css('opacity', 0);
            var this_marker = this;
            setTimeout(function(){
                L.Marker.prototype.onRemove.call(this_marker, map)
            }, 500);
    }})
}
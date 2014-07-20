$(document).ready(function(){

    var markerQueue = [];



    var map = L.mapbox.map('map', 'examples.map-0l53fhk2').setView([38.907, -77.0368], 11);
    // var heat = L.heatLayer(crime_vals.slice(0,10000), {radius: 10, maxZoom: 18}).addTo(map);
    // var draw = true;

    var dc_layer = null;
    $.getJSON('/javascripts/geojson/dc_city_limits.geojson', function(data){
        dc_layer = L.geoJson(data, {fillOpacity: 0}).addTo(map);
    })

    map.on('popupopen', function(e){
        if($(e.popup._content).hasClass('tweetPopup')){
            var tweet_id_str = $(e.popup._content).attr('id');
            $('.leaflet-popup').css('opacity', '0');
            twttr.widgets.createTweetEmbed(tweet_id_str, $('#' + tweet_id_str)[0], function(){
                e.popup._updateLayout(); 
                e.popup._updatePosition();
                $('.leaflet-popup').css('opacity', '1');
            });  
        }
    })

    $.getJSON('/javascripts/geojson/metrolines.geojson', function(data){
        L.geoJson(data, {
            style: function(feature) {
                switch (feature.properties.NAME) {
                    case 'blue': return {color: "#0000ff"};
                    case 'red':   return {color: "#ff0000"};
                    case 'orange': return {color: "#ff6600"};
                    case 'yellow': return {color: "#ffff00"};
                    case 'green': return {color: "#006600"};
                    default: return {color: "#ffffff"};
                }
            }
        }).addTo(map);
    })

    $.getJSON('/javascripts/geojson/metro_stations.geojson', function(data){
        var metro_layer = L.geoJson(data, {
            pointToLayer: function(feature, latlng){
                return L.marker(latlng, {icon: L.icon({
                    iconUrl: '/images/metro_icon.gif',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })}).bindPopup(feature['properties']['NAME']);
            }
        }).addTo(map);
    })



    var socket = io();
    socket.on('tweet', function(tweet){
        addTweetMarker(tweet, map, markerQueue);
    });

    socket.on('ig callback', function(res){
        console.log(res);
    })
})

var config = require('./client_config');
var tweet_markers = require('./tweet_markers');
var instagram_markers = require('./instagram_markers');
var _ = require('lodash');
var FadeMarker = require('./base_markers').FadeMarker;

_.str =require('underscore.string');
$(document).ready(function(){

    var markerQueue = [];
    var layers = {};

    var map = L.mapbox.map('map', 'examples.map-0l53fhk2', { zoomControl:false });
    map.setView(config.MAP_CENTER, config.MAP_ZOOM);
    var controls = require('./controls')(map);

    // var heat = L.heatLayer(crime_vals.slice(0,10000), {radius: 10, maxZoom: 18}).addTo(map);

    $('#cameras').click(function(){
        if(map.hasLayer(layers.camera_layer)){
            map.removeLayer(layers.camera_layer);
        }
        else{
            map.addLayer(layers.camera_layer);
        }
    });

    $('#tweets').click(function(){
        if(map.hasLayer(layers.tweets)){
            map.removeLayer(layers.tweets);
        }
        else{
            map.addLayer(layers.tweets);
        }
    });

    map.on('popupopen', function(e){
        if($(e.popup._content).hasClass('tweetPopup')){
            var tweet_id_str = $(e.popup._content).attr('id');
            $('.leaflet-popup').css('opacity', '0');
            twttr.widgets.createTweetEmbed(tweet_id_str, $('#' + tweet_id_str)[0], function(){
                e.popup._updateLayout(); 
                e.popup._updatePosition();
                $('.leaflet-popup').css('opacity', '1');
                $('.leaflet-popup').css('align', 'center');
            });  
        }
    });
    
    // map.on('zoomend', function(){
    //     console.log('zoooo');
    // });

    // map.on('zoomend', function() {
    //     console.log(layers);
    //     if (map.getZoom() > 14) {
    //         console.log(layers.camera_layer);
    //         map.addLayer(layers.camera_layer);
    //     } else {
    //         map.removeLayer(layers.camera_layer);
    //     }
    // });

    // $.getJSON('/javascripts/geojson/TrafficCamera.geojson', function(data){   
    //     layers.camera_layer = L.geoJson(data, {
    //         pointToLayer: function(feature, latlng){
    //             return new FadeMarker(latlng, {icon: L.divIcon({
    //                 className: 'foo',
    //                 html: '<img style="width:24px;" src="/images/camera_icon.png">',
    //                 iconSize: [16,16]
    //             })});
    //         }
    //     }).bindPopup('Traffic Camera');
    // });

    var socket = io();
    socket.on('tweet', function(tweet){
        console.log(tweet);
        var m = tweet_markers.addMarker(tweet, map, markerQueue);
    });

    socket.on('ig_callback', function(results){
        _.forEach(results, function(post){
            var html = results[0][0];
            var latlon = results[0][1];
            instagram_markers.addMarker(html, map, latlon, markerQueue);        
        });
    });


    var t = {coordinates: {coordinates: [-77.0409607887268, 38.99537317916349]},
        id_str: 'Foo'
    }
        layers.tweets = L.layerGroup();
        layers.tweets.addTo(map);
    var m = tweet_markers.addMarker(t, map, markerQueue);
    layers.tweets.addLayer(m);
});


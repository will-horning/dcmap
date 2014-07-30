var config = require('./client_config');
var tweet_markers = require('./tweet_markers');
var instagram_markers = require('./instagram_markers');
var _ = require('lodash');
var FadeMarker = require('./base_markers').FadeMarker;
_.str =require('underscore.string');
$(document).ready(function(){
    // var tileLayer = new L.mapbox.TileLayer('examples.map-0l53fhk2');
    // var map = L.mapbox.map('map');
    // tileLayer.addTo(map);
    // map.setView(config.MAP_CENTER, config.MAP_ZOOM);
    // console.log(tileLayer);
    // tileLayer.on('loading', function(){
       
    //     map.spin(false, {color: '#ffffff'});
    //     map.spin(true, {color: '#ffffff'});

    // });
    // tileLayer.on('load', function(){
    //     map.spin(false, {color: '#ffffff'});
    // });
    var map = L.mapbox.map('map', 'examples.map-0l53fhk2', { zoomControl:false });
    map.setView(config.MAP_CENTER, config.MAP_ZOOM);
    
    var tweetMarkerQueue = [];
    var igMarkerQueue = [];
    var layers = {};
    layers.tweets = L.layerGroup().addTo(map);
    layers.instagrams = L.layerGroup().addTo(map);
    layers.crimes = L.layerGroup().addTo(map);
    

    $.get('/sidebar', function(data){
        $('#sidebar').html(data);
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

        $('#instagrams').click(function(){
            if(map.hasLayer(layers.instagrams)){
                map.removeLayer(layers.instagrams);
            }
            else{
                map.addLayer(layers.instagrams);
            }
        });

        $('#crimes').click(function(){
            console.log('clicked');
            if(map.hasLayer(layers.crimes)){
                map.removeLayer(layers.crimes);
            }
            else{
                map.addLayer(layers.crimes);
            }
    });
        $('#sidebar').ready(function(){$('#sidebar').show();});
    });

    var controls = require('./controls')(map);
    // var heat = L.heatLayer(crime_vals.slice(0,10000), {radius: 10, maxZoom: 18}).addTo(map);


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

    $.getJSON('/javascripts/geojson/TrafficCamera.geojson', function(data){   
        layers.camera_layer = L.geoJson(data, {
            pointToLayer: function(feature, latlng){
                return new FadeMarker(latlng, {icon: L.divIcon({
                    className: 'foo',
                    html: '<img style="width:24px;" src="' + config.CAMERA_ICON_URL + '">',
                    iconSize: [16,16]
                })});
            }
        }).bindPopup('Traffic Camera');
    });

    var socket = io();

    socket.on('tweet', function(tweet){
        console.log(tweet);
        var m = tweet_markers.addMarker(tweet, map, tweetMarkerQueue);
        layers.tweets.addLayer(m);
    });

    socket.on('tweet_queue', function(tweet_queue){
        _.forEach(tweet_queue, function(tweet){
            var m = tweet_markers.addMarker(tweet, map, tweetMarkerQueue);
            layers.tweets.addLayer(m);
        });
    });

    socket.on('instagram', function(instagrams){
            console.log(instagrams);
        _.forEach(instagrams, function(ig_post){
            var marker = instagram_markers.addMarker(ig_post, map, igMarkerQueue);        
            layers.instagrams.addLayer(marker);
        });
    });

    socket.on('instagram_queue', function(instagram_queue){
        _.forEach(instagram_queue, function(ig_post){
            var marker = instagram_markers.addMarker(ig_post, map, igMarkerQueue);        
            layers.instagrams.addLayer(marker);
        });
    });

    socket.on('crime', function(crime){     
        console.log(crime);
        var crimeIcon = L.divIcon({
            className: 'markericon',
            iconAnchor: [12, 12],
            html: _.str.sprintf('<img style="width:24px;" src="%s">', config.CRIME_ICON_URLS[crime.offense])
        });
        var marker = new FadeMarker([crime.lat, crime.lon], {icon: crimeIcon}).bindPopup(crime.popupContent);
        layers.crimes.addLayer(marker);
    });
});


var config = require('./client_config');
var tweet_markers = require('./tweet_markers');
var instagram_markers = require('./instagram_markers');
var _ = require('lodash');
var FadeMarker = require('./base_markers').FadeMarker;
_.str =require('underscore.string');

var country_codes = require('./country-codes');
$(document).ready(function(){
    var map = L.mapbox.map('map', 'examples.map-0l53fhk2', { zoomControl:false });
    map.setView(config.MAP_CENTER, config.MAP_ZOOM);
    
    var tweetMarkerQueue = [];
    var igMarkerQueue = [];
    var layers = {};
    layers.tweets = L.layerGroup().addTo(map);
    layers.instagrams = L.layerGroup().addTo(map);
    layers.crimes = L.layerGroup();
    layers.cameras = L.layerGroup();
    layers.embassies = L.layerGroup().addTo(map);
    layers.metroLines = L.layerGroup();
    layers.metroStations = L.layerGroup();
    layers.wifi = L.layerGroup();
    
    var addLayerToggle = function(layer, button_id){
        $('#' + button_id).click(function(){
            if(map.hasLayer(layer)){
                map.removeLayer(layer);
            }
            else{
                map.addLayer(layers);
            }
        });
    }


    $.get('/sidebar', function(data){
        $('#sidebar').html(data);
        console.log('foo?');
        console.log($('.layerToggle'));
        $('.layerToggle').click(function(){
            var layer = layers[$(this).attr('id')];
            if(map.hasLayer(layer)){
                map.removeLayer(layer);
            }
            else{
                map.addLayer(layer);
            }
        })
        
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

    $.getJSON('/javascripts/geojson/metrolines.geojson', function(data){
        layers.metroLines.addLayer(L.geoJson(data, {
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
        }));
    });

    $.getJSON('/javascripts/geojson/wifi.geojson', function(data){
        layers.wifi.addLayer(L.geoJson(data, {
            pointToLayer: function(feature, latlng){
                return new FadeMarker(latlng, {icon: L.icon({
                    iconUrl: config.WIFI_ICON_URL,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })}).bindPopup(feature['properties']['NAME']);
            }
        }));
    });


    $.getJSON('/javascripts/geojson/metro_stations.geojson', function(data){
        layers.metroStations.addLayer(L.geoJson(data, {
            pointToLayer: function(feature, latlng){
                return new FadeMarker(latlng, {icon: L.icon({
                    iconUrl: '/images/metro_icon.gif',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })}).bindPopup(feature['properties']['NAME']);
            }
        }));
    });

    $.getJSON('/javascripts/geojson/embassies.geojson', function(data){
        layers.embassies.addLayer(L.geoJson(data, {
            pointToLayer: function(feature, latlng){
                var code = country_codes[feature.properties.COUNTRY] || 'ks';
                return new FadeMarker(latlng, {icon: L.icon({
                    iconUrl: '/images/flags/png/' + code.toLowerCase() + '.png',
                    iconSize: [24, 16],
                    iconAnchor: [12, 8]
                })}).bindPopup(feature.properties.COUNTRY);
            }
        }))
    })

    $.getJSON('/javascripts/geojson/TrafficCamera.geojson', function(data){   
        layers.cameras.addLayer(L.geoJson(data, {
            pointToLayer: function(feature, latlng){
                return new FadeMarker(latlng, {icon: L.divIcon({
                    className: 'foo',
                    html: '<img style="width:24px;" src="' + config.CAMERA_ICON_URL + '">',
                    iconSize: [16,16]
                })}).bindPopup('Traffic Camera');
            }
        }));
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
        var crimeIcon = L.divIcon({
            className: 'markericon',
            iconAnchor: [12, 12],
            html: _.str.sprintf('<img style="width:24px;" src="%s">', config.CRIME_ICON_URLS[crime.offense])
        });
        var marker = new FadeMarker([crime.lat, crime.lon], {icon: crimeIcon}).bindPopup(crime.popupContent);
        layers.crimes.addLayer(marker);
    });
});


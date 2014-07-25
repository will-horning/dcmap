var config = require('./client_config');
var tweet_markers = require('./tweet_markers');
var instagram_markers = require('./instagram_markers');
var _ = require('lodash');

_.str =require('underscore.string');
$(document).ready(function(){

    var markerQueue = [];
    var layers = {};

    var map = L.mapbox.map('map', 'examples.map-0l53fhk2', { zoomControl:false })

    map.setView(config.mapCenter, config.mapZoom);
    // var heat = L.heatLayer(crime_vals.slice(0,10000), {radius: 10, maxZoom: 18}).addTo(map);

    var sidebar = L.control.sidebar('sidebar', {position:'left'});
    map.addControl(sidebar);


    L.Control.SidebarOpen = L.Control.extend({
        options: {
            position: 'topleft'
        },

        onAdd: function (map) {
            var controlDiv = L.DomUtil.create('div', 'leaflet-control-sidebar-open');
            var glyphspan = $('<span></span>');
            glyphspan.addClass('glyphicon')
            glyphspan.addClass('glyphicon-cog')
            L.DomEvent
                .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
                .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
            .addListener(controlDiv, 'click', function(){
                sidebar.toggle();            
            })

            var controlUI = L.DomUtil.create('div', 'leaflet-control-sidebar-open-interior', controlDiv);
            controlUI.title = 'Map Commands';
            return controlDiv;
        }
    });

    var sidebarOpenControl = new L.Control.SidebarOpen();


    sidebar.on('show', function(){
        sidebarOpenControl.removeFrom(map);    
    })
    sidebar.on('hidden', function(){
        sidebarOpenControl.addTo(map);  
                    $('.leaflet-control-sidebar-open-interior').append('<button type="submit" class="btn btn-default"><span class="glyphicon glyphicon-cog"></span> </button>')
  
    })

    map.addControl(sidebarOpenControl);
            $('.leaflet-control-sidebar-open-interior').append('<button type="submit" class="btn btn-default"><span class="glyphicon glyphicon-cog"></span> </button>')



    L.control.fullscreen({position: 'topright'}).addTo(map);




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
    });

    var addMetroLines = function(map){
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
    }
    
    map.on('zoomend', function() {
        console.log(layers);
        if (map.getZoom() > 14) {
            console.log(layers.camera_layer);
            map.addLayer(layers.camera_layer);
        } else {
            map.removeLayer(layers.camera_layer);
        }
    });

    $.getJSON('/javascripts/geojson/TrafficCamera.geojson', function(data){
        var camera_layer = L.geoJson(data, {
            pointToLayer: function(feature, latlng){
                return L.marker(latlng, {icon: L.icon({
                    iconUrl: '/images/camera_icon.png',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })});
            }
        }).bindPopup('Traffic Camera');
        layers.camera_layer = camera_layer;
    })

    //     $.getJSON('/javascripts/geojson/metro_stations.geojson', function(data){
    //         var metro_layer = L.geoJson(data, {
    //             pointToLayer: function(feature, latlng){
    //                 return L.marker(latlng, {icon: L.icon({
    //                     iconUrl: '/images/metro_icon.gif',
    //                     iconSize: [16, 16],
    //                     iconAnchor: [8, 8]
    //                 })}).bindPopup(feature['properties']['NAME']);
    //             }
    //         }).addTo(map);
    //     })
    


    var socket = io();
    socket.on('tweet', function(tweet){
        console.log(tweet);
        tweet_markers.addMarker(tweet, map, markerQueue);
    });

    socket.on('ig_callback', function(results){
        // console.log('ig post received.');
        // console.log(results);
        _.forEach(results, function(post){
            var html = results[0][0];
            var latlon = results[0][1];
            // console.log(post);
            instagram_markers.addMarker(html, map, latlon, markerQueue);        
        })
    });



});

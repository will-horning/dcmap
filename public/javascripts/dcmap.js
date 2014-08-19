var config = require('./client_config');
var tweet_markers = require('./tweet_markers');
var instagram_markers = require('./instagram_markers');
var _ = require('lodash');
var FadeMarker = require('./base_markers').FadeMarker;
_.str =require('underscore.string');
var lineSequences = require('./line_sequences.json');


$(document).ready(function(){
    var map = L.mapbox.map('map', 'examples.map-0l53fhk2', { zoomControl:false });
    map.setView(config.MAP_CENTER, 11);
    
    var tweetMarkerQueue = [];
    var igMarkerQueue = [];
    var layers = {};
    layers.tweets = L.layerGroup().addTo(map);
    layers.instagrams = L.layerGroup().addTo(map);
    layers.crimes = L.layerGroup();
    // layers.cameras = new L.MarkerClusterGroup({disableClusteringAtZoom: 14});
    layers.embassies = L.layerGroup();
    layers.metroLines = L.layerGroup().addTo(map);
    layers.metroStations = L.layerGroup().addTo(map);
    layers.wifi = L.layerGroup();
    
    var geoLayers = require('./geojson_layers')(layers);
    var control = require('./controls')(map, layers);
    // layers.test = new L.MarkerClusterGroup().addTo(map);

    // _.forEach(['GR'], function(line){
    //     _.forEach(linePoint[line], function(p){
    //         var m = L.marker([p[1], p[0]]).bindPopup('<iframe src="http://http://www.wmata.com/rider_tools/pids/showpid.cfm?station_id=36"></iframe>');
    //         layers.test.addLayer(m);
    //     })  
    // })

    // var wifiGeojson = require('./data/wifi.json');
    // layers.wifi = L.geoJson(wifiGeojson, {
    //     pointToLayer: function(feature, latlng){
    //         var ll = feature.geometry.coordinates;
    //         // if(ll[0].isNaN() || ll[1].isNaN()) console.log(ll);
    //         return L.circle([ll[1], ll[0]], 100, {stroke: false, fillColor: '#009999', fillOpacity: 0.6});
    //     }
    // });

    // var wifiPoints = _.map(wifiGeojson.features, function(feature){
    //     var lonlat = feature.geometry.coordinates;
    //     return [lonlat[1], lonlat[0]];
    // })
    // var heat = L.heatLayer(wifiPoints, {radius: 55, maxZoom: 18}).addTo(map);
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
                $('iframe').attr(frameBorder, 0);            
            });  
        }
        if($(e.popup._content).hasClass('metroUpdates')){
            $('.leaflet-popup').css('opacity', '0');
            setTimeout(function(){
                e.popup._updateLayout(); 
                e.popup._updatePosition();
                $('.leaflet-popup-content').removeClass('leaflet-popup-scrolled');
                $('.leaflet-popup').css('opacity', '1');
                $('.leaflet-popup').css('align', 'center');
            }, 100);
        }
    });

    var socket = io();

    // var trainMarkers = [];
    // socket.on('locs', function(locs){
    //     _.forEach(locs, function(loc){
    //         var m = L.marker([loc[0], loc[1]]).addTo(map);
    //         setTimeout(function(){map.removeLayer(m);}, 5000);
    //     });
    // });

    // socket.on('trains', function(trains){
    //     _.forEach(trainMarkers, function(m){
    //         map.removeLayer(m);
    //     });
    //     _.forEach(trains, function(train){
    //         if(train.LocationCode == 'A01'){
    //             console.log(train);
    //         }
    //         var pcontent = train.DestinationName + ', ' + train.LocationCode + ', ' + 
    //         (train.secondsToNext / 60) + ', ' + train.nextStation; 
    //         var latlon = [train.lonlat[1], train.lonlat[0]];
    //         trainMarkers.push(
    //             L.circleMarker(
    //                 latlon, 
    //                 {fillOpacity: 0.6, opacity: 0.7, radius: 11, fillColor: '#00ff00'}
    //         ).bindPopup(pcontent).addTo(map));
    //     });
    // });

    var stationUpdateCodes = require('./data/station-update-codes.json');
    var stations = require('./data/stations.json').Stations;
    _.forEach(stations, function(station){
        var updateCode = stationUpdateCodes[station.Code];
        var popup = L.popup({
            maxWidth: 500,
            maxHeight: 500,
            className: 'metroPopup'
        }).setContent('<div class="metroUpdates">' + 
            '<iframe style="width:350px;height:390px" frameBorder=0 src="' + 
            _.str.sprintf(config.metro.UPDATES_URL, updateCode) + '""></iframe></div>');
        var m = new FadeMarker([station.Lat, station.Lon], {icon: L.icon({
                    iconUrl: '/images/metro_icon.gif',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })}).bindPopup(popup);
        layers.metroStations.addLayer(m);    
    });

    socket.on('tweet', function(tweet){
        if(tweetMarkerQueue.length > config.MARKER_QUEUE_SIZE){
            layers.tweets.removeLayer(markerQueue.shift());
        }
        var m = tweet_markers.addMarker(tweet, map);
        tweetMarkerQueue.push(m);
        layers.tweets.addLayer(m);
    });

    socket.on('instagram', function(instagrams){
        _.forEach(instagrams, function(ig_post){
            if(igMarkerQueue.length > config.MARKER_QUEUE_SIZE){
                layers.instagrams.removeLayer(igMarkerQueue.shift());
            }
            var marker = instagram_markers.addMarker(
                ig_post, 
                map, 
                igMarkerQueue
            );
            igMarkerQueue.push(marker);        
            layers.instagrams.addLayer(marker);
        });
    });

    socket.on('crime', function(crime){     
        var crimeIcon = L.divIcon({
            className: 'markericon',
            iconAnchor: [12, 12],
            html: _.str.sprintf(
                '<img style="width:24px;" src="%s">', 
                config.CRIME_ICON_URLS[crime.offense])
        });
        var marker = new FadeMarker(
            [crime.lat, crime.lon], 
            {icon: crimeIcon}
        ).bindPopup(crime.popupContent);
        layers.crimes.addLayer(marker);
    });
});


var config = require('./client_config');
var tweet_markers = require('./tweet_markers');
var instagram_markers = require('./instagram_markers');
var _ = require('lodash');
var FadeMarker = require('./base_markers').FadeMarker;
_.str =require('underscore.string');
var lineSequences = require('./line_sequences.json');
var metroLines = require('./data/straight_metro_lines.json');

$(document).ready(function(){

// var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
// var map = new L.Map('map', { zoomControl:false });
//     var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
//     var osm = new L.TileLayer(osmUrl, {minZoom: 15, maxZoom: 19, attribution: osmAttrib});       
    // map.addLayer(osm);
    var map = L.mapbox.map('map', 'willhorning.ja8hjdhd', { zoomControl:false });
    map.setView(config.MAP_CENTER, config.MAP_ZOOM);
    
    var tweetMarkerQueue = [];
    var igMarkerQueue = [];
    var layers = {};
    layers.tweets = L.layerGroup().addTo(map);
    layers.instagrams = L.layerGroup().addTo(map);
    layers.crimes = L.layerGroup();
    layers.trains = L.layerGroup();
    // layers.cameras = new L.MarkerClusterGroup({disableClusteringAtZoom: 14});
    layers.embassies = L.layerGroup();
    layers.metroLines = L.layerGroup().addTo(map);
    layers.metroStations = L.layerGroup().addTo(map);
    layers.wifi = L.layerGroup();

    var lineStyle = function(line){
        switch (line) {
            case 'BL': return "#0000B0";
            case 'RD':   return "#9E0003";
            case 'OR': return "#C97600";
            case 'YL': return "#DBD800";
            case 'GR': return "#059600";
            default: return "#aaaaaa";
        }
    }
    
    var parallelLine = function(latlngs, dist, n_lines, colors, options){
        var lines = [];
        for(var i = 0; i < n_lines; i++){
            var newLatlngs = [latlngs[0]];
            for(var j = 1; j < latlngs.length - 1; j++){
                newLatlngs.push([latlngs[j][0] + dist * i, latlngs[j][1] + dist * i]);
            }   
            newLatlngs.push(latlngs[latlngs.length - 1]);
            // console.log(newLatlngs);
            lines.push(L.polyline(newLatlngs, {color: colors[i], weight:3}));
        }
        return lines;
    }

    _.forOwn(metroLines, function(latlngs, line){
        // if(line == 'BL'){
        //     var lines = parallelLine(latlngs, 0.0001, 2, ['#0000ff', '#00ff00'], [{},{}]);
        //     console.log(lines);
        //     _.forEach(lines, function(l){layers.metroLines.addLayer(l);});
        // }
        // else{
            var color = lineStyle(line);
            layers.metroLines.addLayer(L.polyline(latlngs, {color: color, opacity: 0.6, weight: 2}));
        // }
    });



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

    var stationUpdateCodes = require('./data/station-update-codes.json');
    var stations = require('./data/stations.json');
    _.forEach(_.values(stations), function(station){
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

    var trainMarkers = [];
    socket.on('train_updates', function(updates){
        layers.trains.clearLayers();
        trainMarkers = [];
        _.forEach(updates, function(update){
            console.log(update.line);
            var color = lineStyle(update.line);
            var m = L.circleMarker(update.latlon, {radius: 6, stroke: false, fillColor: color, fillOpacity: 0.6});
            layers.trains.addLayer(m);
        });
    })

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


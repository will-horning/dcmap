var config = require('./client_config');
var tweet_markers = require('./tweet_markers');
var instagram_markers = require('./instagram_markers');
var _ = require('lodash');
var FadeMarker = require('./base_markers').FadeMarker;
_.str =require('underscore.string');
var metroLines = require('./data/straight_metro_lines.json');
var fundraisers = require('./data/fundraisers.json');

$(document).ready(function(){

    var map = L.mapbox.map('map', 'willhorning.ja8hjdhd', { zoomControl:false });
    map.setView(config.MAP_CENTER, config.MAP_ZOOM);
    
    var tweetMarkerQueue = [];
    var igMarkerQueue = [];
    var layers = {};
    layers.tweets = L.layerGroup().addTo(map);
    layers.instagrams = L.layerGroup().addTo(map);
    layers.crimes = L.layerGroup();
    layers.trains = L.layerGroup();
    // layers.cameras = L.layerGroup();
    // layers.embassies = L.layerGroup();
    layers.metroLines = L.layerGroup().addTo(map);
    layers.metroStations = L.layerGroup().addTo(map);
    layers.wifi = L.layerGroup();

    layers.fundraisers = L.layerGroup();

    _.forEach(fundraisers, function(p){
        var popupContent = [
            'Address: ' + p.venue.address1,
            'Venue: ' + p.venue.venue_name,
            'Beneficiary: ' + p.beneficiaries[0].name,
            'Party: ' + p.party,
            'Avg. Contribution: ' + p.contributions_info,
            'Date :' + p.start_date
        ].join('<br><br>');
        var iconUrl = config.NO_PARTY_ICON;
        if(p.party == 'R') iconUrl = config.GOP_ICON;
        else if(p.party == 'D') iconUrl = config.DNC_ICON;
        var m = new FadeMarker([p.lat, p.lon], {icon: L.icon({
            iconUrl: iconUrl,
            iconsize: [16,16]
        })}).bindPopup(popupContent);
        layers.fundraisers.addLayer(m);
    })

    var control = require('./controls')(map, layers);

     $.getJSON('/tweet_queue', function(tweets){
        _.forEach(tweets, function(tweet){
            if(tweetMarkerQueue.length > config.MARKER_QUEUE_SIZE){
                layers.tweets.removeLayer(tweetMarkerQueue.shift());
            }
            var m = tweet_markers.addMarker(tweet, map);
            tweetMarkerQueue.push(m);
            layers.tweets.addLayer(m);            
        })
    });

    $.getJSON('/instagram_queue', function(instagrams){
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

    $.getJSON('/crime_queue', function(crimes){
        _.forEach(crimes, function(crime){
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

    var wifiGeojson = require('./data/wifi.json');
    layers.wifi = L.geoJson(wifiGeojson, {
        pointToLayer: function(feature, latlng){
            var ll = feature.geometry.coordinates;
            // if(ll[0].isNaN() || ll[1].isNaN()) console.log(ll);
            return L.circle([ll[1], ll[0]], 100, {stroke: false, fillColor: '#009999', fillOpacity: 0.6});
        }
    });

    _.forOwn(metroLines, function(latlngs, line){
        var color = config.metro.LINE_COLOR[line];
        layers.metroLines.addLayer(
            L.polyline(
                latlngs, 
                {color: color, opacity: 0.6, weight: 2}
            )
        );
    });


    // layers.cameras.addLayer(L.geoJson(trafficCameras, {
    //     pointToLayer: function(feature, latlng){
    //         return new FadeMarker(latlng, {icon: L.divIcon({
    //             className: 'foo',
    //             html: '<img style="width:24px;" src="' + config.CAMERA_ICON_URL + '">',
    //             iconSize: [16,16]
    //         })}).bindPopup('Traffic Camera');
    //     }
    // }));

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

    var trainMarkers = [];
    socket.on('train_updates', function(updates){
        layers.trains.clearLayers();
        trainMarkers = [];
        _.forEach(updates, function(update){
            var color = config.metro.LINE_COLOR[update.line];
            var m = L.circleMarker(update.latlon, {radius: 6, stroke: false, fillColor: color, fillOpacity: 0.6});
            layers.trains.addLayer(m);
        });
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
   
});


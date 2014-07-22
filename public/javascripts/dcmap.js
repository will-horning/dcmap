$(document).ready(function(){

    var markerQueue = [];
    var map = L.mapbox.map('map', 'examples.map-0l53fhk2')
    map.setView(config.mapCenter, config.mapZoom);
    // var heat = L.heatLayer(crime_vals.slice(0,10000), {radius: 10, maxZoom: 18}).addTo(map);

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

    var addMetroStations = function(map){
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
    }
    


    var socket = io();
    socket.on('tweet', function(tweet){
        addTweetMarker(tweet, map, markerQueue);
    });

    socket.on('igres', function(q){
        console.log(q);
    });

    socket.on('ig_callback', function(results){
        console.log('ig post received.');
        console.log(results);
        _.forEach(results, function(post){
            var html = results[0][0];
            var latlon = results[0][1];
            console.log(post);
            addInstagramMarker(html, map, latlon, markerQueue);        
        })
    });

    // var addInstagramMarker = function(iframe, map, latlon, markerQueue){
    //         addCircleMarker(map, latlon);
    //         var mypopup = L.popup({
    //             maxWidth: 600,
    //             maxHeight: 800,
    //             className: 'myPopup'
    //         }).setContent('<div class="instagramPopup" style="width:500px;"><iframe style="width:500px;height:630px;" src="' + iframe + '"></iframe></div>');
    //         if(markerQueue.length > config.markerQueueSize){
    //             map.removeLayer(markerQueue.shift());
    //         }
    //         var marker = L.marker(
    //             latlon, 
    //             {icon: L.divIcon({
    //                 className: 'markericon',
    //                 iconAnchor: [12, 12],
    //                 html: '<img style="width:24px;" src="/images/mascoticons/32x32/instagram-32x32.png">'
    //             })}
    //         ).bindPopup(mypopup).addTo(map);
    //         markerQueue.push(marker);
    // };



});

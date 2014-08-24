var FadeMarker = require('./base_markers').FadeMarker;
var config = require('./client_config');
var country_codes = require('./data/country-codes.json');

module.exports = function(layers){

    // $.getJSON('/javascripts/geojson/metrolines.geojson', function(data){
    //     layers.metroLines.addLayer(L.geoJson(data, {
    //         style: function(feature) {
    //             switch (feature.properties.NAME) {
    //                 case 'blue': return {color: "#0000ff"};
    //                 case 'red':   return {color: "#ff0000"};
    //                 case 'orange': return {color: "#ff6600"};
    //                 case 'yellow': return {color: "#ffff00"};
    //                 case 'green': return {color: "#006600"};
    //                 default: return {color: "#ffffff"};
    //             }
    //         }
    //     }));
    // });



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


    // $.getJSON('/javascripts/geojson/metro_stations.geojson', function(data){
    //     layers.metroStations.addLayer(L.geoJson(data, {
    //         pointToLayer: function(feature, latlng){
    //             return new FadeMarker(latlng, {icon: L.icon({
    //                 iconUrl: '/images/metro_icon.gif',
    //                 iconSize: [16, 16],
    //                 iconAnchor: [8, 8]
    //             })}).bindPopup(feature['properties']['NAME'] + '    ' + latlng);
    //         }
    //     }));
    // });

    // $.getJSON('/javascripts/geojson/embassies.geojson', function(data){
    //     layers.embassies.addLayer(L.geoJson(data, {
    //         pointToLayer: function(feature, latlng){
    //             var code = country_codes[feature.properties.COUNTRY] || 'ks';
    //             return new FadeMarker(latlng, {icon: L.icon({
    //                 iconUrl: '/images/flags/png/' + code.toLowerCase() + '.png',
    //                 iconSize: [24, 16],
    //                 iconAnchor: [12, 8]
    //             })}).bindPopup(feature.properties.COUNTRY);
    //         }
    //     }))
    // })

    // $.getJSON('/javascripts/geojson/TrafficCamera.geojson', function(data){   
    //     layers.cameras.addLayer(L.geoJson(data, {
    //         pointToLayer: function(feature, latlng){
    //             return new FadeMarker(latlng, {icon: L.divIcon({
    //                 className: 'foo',
    //                 html: '<img style="width:24px;" src="' + config.CAMERA_ICON_URL + '">',
    //                 iconSize: [16,16]
    //             })}).bindPopup('Traffic Camera');
    //         }
    //     }));
    // });
    return layers;
};
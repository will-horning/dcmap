
$.getJSON('/javascripts/geojson/metrolines.geojson', function(data){
    layers.metroLines = L.geoJson(data, {
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
    });
});

$.getJSON('/javascripts/geojson/metro_stations.geojson', function(data){
    layers.metroStations = L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return L.marker(latlng, {icon: L.icon({
                iconUrl: '/images/metro_icon.gif',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            })}).bindPopup(feature['properties']['NAME']);
        }
    }).addTo(map);
})

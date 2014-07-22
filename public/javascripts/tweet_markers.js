var addCircleMarker = function(map, latlon){
    var circle_marker = L.marker(
        latlon, 
        {icon: L.divIcon({
            className: 'circleMarker',
            iconAnchor: [24, 24],
            iconSize: [48,48]
    })}).addTo(map);
    setInterval(function() {map.removeLayer(circle_marker);}, 2000);
};

var tweetIcon = L.divIcon({
    className: 'markericon',
    iconAnchor: [12, 12],
    html: _.str.sprintf('<img style="width:24px;" src="%s">', config.twitter.iconPath)
});

var addTweetMarker = function(tweet, map, markerQueue){
    var latlon = [
        tweet.coordinates.coordinates[1],
        tweet.coordinates.coordinates[0]
    ];
    addCircleMarker(map, latlon);
    var mypopup = L.popup({
        maxWidth: 600,
        maxHeight: 300,
        className: 'myPopup'
    }).setContent('<div class="tweetPopup" style="width:500px;" id="' + tweet.id_str + '"></div>');
    var marker = L.marker(latlon, {icon: tweetIcon}
        ).bindPopup(mypopup).addTo(map);
    markerQueue.push(marker);
    if(markerQueue.length > 30){
        map.removeLayer(markerQueue.shift());
    }
};

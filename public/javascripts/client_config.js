var config = {};
config.MARKER_QUEUE_SIZE = 30;
config.MAP_CENTER = [38.907, -77.0368];
config.MAP_ZOOM = 11;
config.instagram = {};
config.twitter = {};
config.instagram.ICON_PATH = "/images/mascoticons/32x32/instagram-32x32.png";
config.twitter.ICON_PATH = "/images/mascoticons/32x32/twitter-32x32.png";
config.SIDEBAR_WIDTH = '250px';
config.CAMERA_ICON_URL = '/images/mapicons.nicolasmollet.com/road-transportation-78005c/trafficcamera.png';
config.WIFI_ICON_URL = '/images/mapicons.nicolasmollet.com/interior/wifi.png';
config.CRIME_ICON_URLS = {
        'THEFT F/AUTO': '/images/mapicons.nicolasmollet.com/crime/theft.png',
        'HOMICIDE': '/images/mapicons.nicolasmollet.com/crime/crimescene.png',
        'ASSAULT W/DANGEROUS WEAPON': '/images/mapicons.nicolasmollet.com/crime/shooting.png',
        'ROBBERY': '/images/mapicons.nicolasmollet.com/crime/theft.png',
        'BURGLARY': '/images/mapicons.nicolasmollet.com/crime/theft.png',
        'MOTOR VEHICLE THEFT': '/images/mapicons.nicolasmollet.com/road-transportation-78005c/car.png',
        'THEFT/OTHER': '/images/mapicons.nicolasmollet.com/crime/theft.png',
        'SEX ABUSE': '/images/mapicons.nicolasmollet.com/crime/rape.png',
        'ARSON': '/images/mapicons.nicolasmollet.com/crime/fire.png'
};

config.metro = {};
config.metro.UPDATES_URL =  'http://www.wmata.com/rider_tools/pids/showpid.cfm?station_id=%s';


module.exports = config;
var config = {};

config.CRIME_FEED_URL = 'http://data.octo.dc.gov/feeds/crime_incidents/crime_incidents_current.xml';

config.foursquare = {};
config.foursquare.CLIENT_ID = process.env['FOURSQUARE_CLIENT_ID'];
config.foursquare.CLIENT_SECRET = process.env['FOURSQUARE_CLIENT_SECRET'];

config.metro = {};
config.metro.PREDICTION_INTERVAL = 15000;
config.metro.ANIM_INTERVAL = 501;
config.metro.API_KEY = process.env['METRO_KEY'];
config.metro.LINE_CODES = ['RD', 'BL', 'YL', 'OR', 'GR', 'SV'];
config.metro.ALL_STATIONS_URL = 'http://api.wmata.com/Rail.svc/json/JStations?api_key=%s';
config.metro.ALL_UPDATES_URL = 'http://api.wmata.com/StationPrediction.svc/json/GetPrediction/All?api_key=%s';
var CONV_HOST = 'http://citizenatlas.dc.gov/';
var SPS_CONV_URL = CONV_HOST + 'usng/getusng.asmx/MD_SPCStoLL?SPCSXYSTR=%s,%s';
config.SCS_TO_GPS_URL = 'http://citizenatlas.dc.gov/usng/getusng.asmx/MD_SPCStoLL?SPCSXYSTR=%s,%s';

config.mongo = {};
config.mongo.MONGOHQ_URL = process.env['MONGOHQ_URL'];
config.mongo.MONGOHQ_METRO_URL = process.env['MONGOHQ_METRO_URL'];
config.mongo.QUEUE_SIZE = 5;

config.instagram = {};
config.instagram.CLIENT_ID = process.env['INSTAGRAM_CLIENT_ID'];
config.instagram.CLIENT_SECRET = process.env['INSTAGRAM_CLIENT_SECRET'];
config.instagram.DELETE_SUBS_URL = 'https://api.instagram.com/v1/subscriptions?client_secret=%s&object=all&client_id=%s';
config.instagram.DELETE_SUBS_PARAMS = {
    client_secret: config.instagram.CLIENT_SECRET,
    client_id: config.instagram.CLIENT_ID,
    object: 'all'
}
config.instagram.GET_SUBS_URL = 'https://api.instagram.com/v1/subscriptions?client_secret=%s&client_id=%s';
config.instagram.GET_SUBS_PARAMS = {
    client_secret: config.instagram.CLIENT_SECRET,
    client_id: config.instagram.CLIENT_ID,
    object: 'all'
}
config.instagram.PHOTO_POST_URL = 'https://api.instagram.com/v1/geographies/%s/media/recent?client_id=%s';
config.instagram.CALLBACK_URL = 'http://dcmap.herokuapp.com/instagram_callback';
config.instagram.CENTER_LAT = 38.93003656944161;
config.instagram.CENTER_LON = -77.02566146850586;
config.instagram.RADIUS = 5000;

config.twitter = {};
config.twitter.CONSUMER_KEY = process.env['TWITTER_CONSUMER_API_KEY'];
config.twitter.CONSUMER_SECRET = process.env['TWITTER_CONSUMER_API_SECRET'];
config.twitter.ACCESS_TOKEN = process.env['TWITTER_API_ACCESS_TOKEN'];
config.twitter.ACCESS_TOKEN_SECRET = process.env['TWITTER_API_ACCESS_TOKEN_SECRET'];

config.sunlight = {};
config.sunlight.API_KEY = process.env['SUNLIGHT_API_KEY'];
config.sunlight.EVENTS_URL = 'http://politicalpartytime.org/api/v1/event/';
config.sunlight.PARAMS = {
    start_date_gt: '2014-07-01',
    start_date_lt: '2014-12-01',
    apikey: config.sunlight.API_KEY,
    format: 'json'
};

config.DC_BOUNDING_BOX = [
    '-77.14007377624512',
    '38.81416486985497', 
    '-76.88631534576416', 
    '38.99157075894212'
];
config.DC_BOUNDING_POLYGON = [
    [-77.0409607887268, 38.99537317916349],
    [-76.90961837768555, 38.89103282648846],
    [-77.03901886940002, 38.79162348028979],
    [-77.02686309814453, 38.85521601075258],
    [-77.0577621459961, 38.89904904367505],
    [-77.1009349822998, 38.91093809928134],
    [-77.11960315704346, 38.934042589137526]
];



module.exports = config;
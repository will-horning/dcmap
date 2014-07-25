var config = {};




config.instagram = {};
config.instagram.CLIENT_ID = process.env['INSTAGRAM_CLIENT_ID'];
config.instagram.CLIENT_SECRET = process.env['INSTAGRAM_CLIENT_SECRET'];
config.instagram.DELETE_SUBS_URL = 'https://api.instagram.com/v1/subscriptions?client_secret=%s&object=all&client_id=%s';
config.instagram.GET_SUBS_URL = 'https://api.instagram.com/v1/subscriptions?client_secret=%s&client_id=%s';
config.instagram.PHOTO_POST_URL = 'https://api.instagram.com/v1/geographies/%s/media/recent?client_id=%s';
config.instagram.CALLBACK_URL = 'http://dcmap.herokuapp.com/instagram_callback';
config.instagram.CENTER_LAT = 38.99537317916349;
config.instagram.CENTER_LON = -77.0409607887268;
config.instagram.RADIUS = 5000;

config.twitter = {};
config.twitter.CONSUMER_KEY = process.env['TWITTER_CONSUMER_API_KEY'];
config.twitter.CONSUMER_SECRET = process.env['TWITTER_CONSUMER_API_SECRET'];
config.twitter.ACCESS_TOKEN = process.env['TWITTER_API_ACCESS_TOKEN'];
config.twitter.ACCESS_TOKEN_SECRET = process.env['TWITTER_API_ACCESS_TOKEN_SECRET'];


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
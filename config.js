var config = {};
config.twitter_api = {}

config.twitter_api.consumer_key = process.env['TWITTER_CONSUMER_API_KEY'];
config.twitter_api.consumer_secret = process.env['TWITTER_CONSUMER_API_SECRET'];
config.twitter_api.access_token = process.env['TWITTER_API_ACCESS_TOKEN'];
config.twitter_api.access_token_secret = process.env['TWITTER_API_ACCESS_TOKEN_SECRET'];
config.dc_bounding_box = [
    '-77.14007377624512',
    '38.81416486985497', 
    '-76.88631534576416', 
    '38.99157075894212'
];
config.dc_bounding_polygon = [
    [-77.0409607887268, 38.99537317916349],
    [-76.90961837768555, 38.89103282648846],
    [-77.03901886940002, 38.79162348028979],
    [-77.02686309814453, 38.85521601075258],
    [-77.0577621459961, 38.89904904367505],
    [-77.1009349822998, 38.91093809928134],
    [-77.11960315704346, 38.934042589137526]
];



module.exports = config;
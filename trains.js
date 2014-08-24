var lineSequences = require('./data/line_sequences.json');
var linepoints = require('./data/linepoints.json');
var stations = require('./public/javascripts/data/stations.json');
var moment = require('moment');
var triptimes = require('./public/javascripts/data/triptimes.json');
var config = require('./config');
var request = require('request');
var _ = require('lodash');
_.str = require('underscore.string');

var getPrevStation = function(train){
    if(lineSequences[train.Line] === undefined) return null;
    if(train.DestinationCode === null) return null;
    var stationIndex = _.findIndex(lineSequences[train.Line], function(station){
        return station.StationCode == train.LocationCode;
    });
    var destIndex = _.findIndex(lineSequences[train.Line], function(station){
        return station.StationCode == train.DestinationCode;
    });
    if(stationIndex < destIndex){
        if(stationIndex - 1 < 0) return null;
        else return lineSequences[train.Line][stationIndex - 1].StationCode;
    }
    else{
        if(stationIndex >= lineSequences[train.Line].length - 1) return train.LocationCode;
        else return lineSequences[train.Line][stationIndex + 1].StationCode;
    }
};

var createUpdateObject = function(trains){
    _.forEach(trains, function(t){
        if(t.Min == 'BRD' || t.Min == 'ARR') t.Min = 0;
        else t.Min = parseInt(t.Min);
    })
    var updates = _.groupBy(trains, function(train){
        return train.LocationCode;
    });
    _.forOwn(updates, function(trains, station){
        var groups = _.groupBy(trains, function(train){return train.Group;});
        updates[station] = {track_1: null, track_2: null};
        if(groups[1] !== undefined){
            updates[station].track_1 = _.min(groups[1], function(t){
                return t.Min == 'BRD' || t.Min == 'ARR' ? 0 : t.Min;
            });
        }
        if(groups[2] !== undefined){
            updates[station].track_2 = _.min(groups[2], function(t){
                return t.Min == 'BRD' || t.Min == 'ARR' ? 0 : t.Min;
            });
        }
    });
    return updates;
};

var updates = {};
_.forEach(_.keys(stations), function(station){
    updates[station] = {track_1: null, track_2: null};
});

var moveEnrouteTrains = function(io){
    var now = moment().unix();
    _.forOwn(updates, function(tracks, station){
        _.forOwn(tracks, function(train, track){
            if(train !== null){
                var a = {x: train.latlon_a[0], y: train.latlon_a[1]};
                var b = {x: train.latlon_b[0], y: train.latlon_b[1]};
                var progress = (now - train.StartTime) / train.Duration;
                if(progress <= 1){
                    var dx = (b.x - a.x) * progress;
                    var dy = (b.y - a.y) * progress;
                    train.position = [a.x + dx, a.y + dy];
                }
                else{
                    updates[station][track] = null;
                }
            }
        })
    });
    var coords = [];
    _.forEach(_.values(updates), function(tracks){
        if(tracks.track_1 !== null) coords.push({
            latlon: tracks.track_1.position,
            line: tracks.track_1.Line
        });
        if(tracks.track_2 !== null) coords.push({
            latlon: tracks.track_2.position,
            line: tracks.track_2.Line
        });
    });
    io.emit('train_updates', coords);
}

var updateTrains = function(){
    var url = _.str.sprintf(config.metro.ALL_UPDATES_URL, config.metro.API_KEY);
    request({url: url, json: true}, function(err, res, body){
        var newUpdates = createUpdateObject(body.Trains);
        _.forOwn(newUpdates, function(tracks, station){
            _.forOwn(tracks, function(train, track){
                if(train !== null){
                    var lastUpdate = updates[station][track];
                    var stop_a = getPrevStation(train);
                    var stop_b = train.LocationCode;
                    var tripTime = triptimes[stop_a + ',' + stop_b];
                    if(lastUpdate === null && stop_a !== null && train.Min <= tripTime){
                        train['Duration'] = train.Min * 60;
                        train['latlon_a'] = [stations[stop_a].Lat, stations[stop_a].Lon];
                        train['latlon_b'] = [stations[stop_b].Lat, stations[stop_b].Lon];
                        train['StartTime'] = moment().unix();
                        train['position'] = train.latlon_a;
                        updates[station][track] = train;
                    }
                }
            });
        });

    });    
};

module.exports = {
    moveEnrouteTrains: moveEnrouteTrains,
    updateTrains: updateTrains
}

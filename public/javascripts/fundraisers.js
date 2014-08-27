var config = require('./client_config');
var FadeMarker = require('./base_markers').FadeMarker;
var _ = require('lodash');

var getParty = function(e){
    var r = false;
    var d = false;
    e.party = 'NP';
    _.forEach(e.beneficiaries, function(legislator){
        if(legislator.party == 'R') r = true;
        else if(legislator.party == 'D') d = true;
    });
    if(r && d) return 'NP';
    else if(r) return 'R';
    else if(d) return 'D';
    return 'NP';                
}

var getFullAddress = function(e){
    if(e.venue.state == 'VA') return e.venue.address1 + ', Virginia'; 
    else if(e.venue.state == 'MD') return e.venue.address1 + ', Maryland'; 
    else return e.venue.address1 + ', Washington DC'; 
}

var addFundraiserMarker = function(e, latlon){
    var party = getParty(e);
    var iconUrl = config.NO_PARTY_ICON;
    if(party == 'R') iconUrl = config.GOP_ICON;
    else if(party == 'D') iconUrl = config.DNC_ICON;
    var m = new FadeMarker(latlon, {icon: L.icon({
        iconUrl: iconUrl,
        iconsize: [16,16]
    })}).bindPopup(e.popupContent);
    return m;
}

var getFundraisers = function(offset, layer){
    $.getJSON('/fundraisers', {offset: offset}, function(res){
        var events = res.events;
        _.forEach(events, function(e){
            var params = {q: getFullAddress(e), format: 'json'};
            $.getJSON(config.NOMINATIM_URL, params, function(loc){
                if(loc !== undefined && loc.length > 0){
                    var m = addFundraiserMarker(e, [loc[0].lat, loc[0].lon]);
                    layer.addLayer(m);
                }
            });
        });         
    });
}

module.exports = function(layer){
    $.getJSON('/fundraisers', {offset: 0}, function(res){
        for(var i = 0; i < res.total; i += 50){
            getFundraisers(i, layer);                           
        }
    });
    return layer;
}
    
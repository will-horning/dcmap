var config = require('./client_config');

module.exports = function(map){
    L.control.fullscreen({position: 'topright'}).addTo(map);

    sidebar = L.control.sidebar('sidebar', {position:'left', autoPan: false});
    map.addControl(sidebar);
    $('.leaflet-sidebar').css('width', config.SIDEBAR_WIDTH);

    L.Control.SidebarOpen = L.Control.extend({
        options: {position: 'topleft'},
        onAdd: function (map) {
            var controlDiv = L.DomUtil.create('div', 'leaflet-control-sidebar-open');
            var glyphspan = $('<span></span>');
            glyphspan.addClass('glyphicon');
            glyphspan.addClass('glyphicon-cog');
            L.DomEvent
                .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
                .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
            .addListener(controlDiv, 'click', function(){
                sidebar.toggle();            
            });

            var controlUI = L.DomUtil.create('div', 'leaflet-control-sidebar-open-interior', controlDiv);
            controlUI.title = 'Map Commands';
            return controlDiv;
        }
    });

    sidebarOpenControl = new L.Control.SidebarOpen();


    sidebar.on('show', function(){
        sidebarOpenControl.removeFrom(map);    
    });
    sidebar.on('hidden', function(){
        sidebarOpenControl.addTo(map);  
                    $('.leaflet-control-sidebar-open-interior').append('<button type="submit" class="btn btn-default"><span class="glyphicon glyphicon-cog"></span> </button>');
  
    });

    map.addControl(sidebarOpenControl);
            $('.leaflet-control-sidebar-open-interior').append('<button type="submit" class="btn btn-default"><span class="glyphicon glyphicon-cog"></span> </button>');

    module.sidebar = sidebar;
    module.sidebarOpenControl = sidebarOpenControl;
}
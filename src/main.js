

//var host = 'https://demo.keplerjs.io';
var host = 'http://localhost:8800';

var $ = jQuery = require('jquery');
var _ = require('underscore');

var L = require('leaflet');
var Chartist = require('chartist');

var d3 = require('d3');
var d3L = require('@asymmetrik/leaflet-d3');

require('../node_modules/leaflet/dist/leaflet.css');
require('../node_modules/chartist/dist/chartist.css');


$(function() {

var	$legend = $('.chartLegend'),
	$users = $('<a>',{'class': 'users'}).appendTo($legend),
	$places = $('<a>',{'class': 'places'}).appendTo($legend),
	$convers = $('<a>',{'class': 'convers'}).appendTo($legend);
	
var worldCenter = [40,0],
	worldZoom = 3,
	map = L.map('map', {
		center: worldCenter,
		zoom: worldZoom,
		minZoom: worldZoom,
		maxZoom: 8,
		boxZoom: false,
		trackResize:true,
		//dragging: false,
		//keyboard: false,
		scrollWheelZoom:false,
		//doubleClickZoom:false,
		attributionControl: false,
		zoomControl: false,
	});

window.map = map;

var geoLayer = L.geoJSON(null, {
	style: {
		weight: 1,
		opacity: 0.8,
		color: '#9c0',
		fillColor: '#9c0',
		fillOpacity: 0.1
	}
}).addTo(map);

L.HexbinLayer = L.HexbinLayer.extend({
	show: function(map) {
		
		//hexPlacesLayer._dataPrev = hexPlacesLayer._data;
		//hexPlacesLayer.data([]).redraw();
		if(this._dataOld) {
			this._data = this._dataOld;
			delete this._dataOld;
		}
		this.redraw();
	},
	hide: function(map) {
		if(!this._dataOld) {
			this._dataOld = this._data;
			this._data = [];
		}
		this.redraw();
	}	
});
//
//https://github.com/Asymmetrik/leaflet-d3
//http://jsfiddle.net/reblace/acjnbu8t/?utm_source=website&utm_medium=embed&utm_campaign=acjnbu8t
//
var hexPlacesLayer = new L.HexbinLayer({
		radius: 20,
		opacity: 0.8,
		//colorScaleExtent: [ 1, undefined ],
		//radiusScaleExtent: [ 1, undefined ],
		colorRange: ['#a0b8b9','#225577'],
		radiusRange: [8, 16]
	})
	.colorValue(function(d) {
		return d.length*3;
	})
	.radiusValue(function(d) {
		return d.length;
	});

var hexUsersLayer = new L.HexbinLayer({
		radius: 10,
		opacity: 0.9,
		//colorScaleExtent: [ 1, undefined ],
		//radiusScaleExtent: [ 1, undefined ],
		colorRange: ['#f9b378','#ff8833'],
		radiusRange: [3, 5]
	})
	.colorValue(function(d) {
		return d.length*3;
	})
	.radiusValue(function(d) {
		return d.length;
	});

var pingInterval = 1500;

var pingPlacesLayer = L.pingLayer({
		radiusRange: [2, 16]
	}).addTo(map);

var pingUsersLayer = L.pingLayer({
		radiusRange: [2, 16]
	}).addTo(map);

$.getJSON('https://unpkg.com/geojson-resources@1.1.0/world.json', function(json) {
	geoLayer.addData(json);
});

/* layers */
$.when(
	$.ajax({
		url: host+'/stats/places/bygeo',
	    jsonp: 'jsonp', dataType: 'jsonp',
	    timeout: 1000
	}),
	$.ajax({
		url: host+'/stats/users/bygeo',
	    jsonp: 'jsonp', dataType: 'jsonp',
	    timeout: 1000
	})
).then(function(ret1, ret2) {
	var places = ret1[0],
		users = ret2[0];

	setInterval(function() {
		pingPlacesLayer.ping(places.features[0].geometry.coordinates, 'pingPlaces');
	}, pingInterval);

	setInterval(function() {
		pingUsersLayer.ping(users.features[0].geometry.coordinates, 'pingUsers');
	}, pingInterval);

	var pp = _.map(places.features, function(f) {
		return f.geometry.coordinates;
	});
	
	hexPlacesLayer.data( pp );

	hexUsersLayer.data( _.map(users.features, function(f) {
		return f.geometry.coordinates;
	}) );

	function fitStats() {
		map.addLayer(geoLayer);
		map.addLayer(hexPlacesLayer);
		map.addLayer(hexUsersLayer);
		map.setView(worldCenter, worldZoom, {animate: false });
		hexPlacesLayer.show();
		hexUsersLayer.show();
	}

	fitStats();

	$('article').on('click', fitStats);	

	$places.on('click', function(e) {
		//map.removeLayer(hexUsersLayer);
		////map.removeLayer(hexUsersLayer);
		hexUsersLayer.hide();
		hexPlacesLayer.show();
	});
	$users.on('click', function(e) {
		//map.removeLayer(hexPlacesLayer);
		//map.addLayer(hexUsersLayer);
		hexPlacesLayer.hide();
		hexUsersLayer.show();
	});
});

///////////////// CHARTS
///

function normalizeAxisX(series) {

	var lasts = _.map(series, function(vv) {
			return _.last(vv);
		}),
		lmax = _.max(lasts, function(v) {
			return v.x.getTime();
		}).x.getTime();
	
	for(var s in series) {
		var last = _.last(series[s]),
			lastX = last.x.getTime();

		if(lastX < lmax) {
			series[s].push({
				x: lmax,
				y: last.y
			});
		}
	}
}

$.when(
	$.ajax({
		url: host+'/stats/users/bydate',
	    jsonp: 'jsonp', dataType: 'jsonp',
	    timeout: 1000
	}),
	$.ajax({
		url: host+'/stats/places/bydate',
	    jsonp: 'jsonp', dataType: 'jsonp',
	    timeout: 1000
	}),
	$.ajax({
		url: host+'/stats/convers/bydate',
	    jsonp: 'jsonp', dataType: 'jsonp',
	    timeout: 1000
	})
).then(function(ret1, ret2, ret3) {
	var usersByDate = ret1[0],
		placesByDate = ret2[0],
		conversByDate = ret3[0];

	$users.html('<big>'+usersByDate.count+'</big> users');
	$places.html('<big>'+placesByDate.count+'</big> places');	
	$convers.html('<big>'+conversByDate.count+'</big> messages');

	var chartUsers = []
	for(var i in usersByDate.rows) {
		chartUsers.push({
			x: new Date(usersByDate.rows[i][0]),
			y: usersByDate.rows[i][1]
		});
	}

	var chartPlaces = []
	for(var i in placesByDate.rows) {
		chartPlaces.push({
			x: new Date(placesByDate.rows[i][0]),
			y: placesByDate.rows[i][1]
		});
	}

	var chartConvers = []
	for(var i in conversByDate.rows) {
		chartConvers.push({
			x: new Date(conversByDate.rows[i][0]),
			y: conversByDate.rows[i][1]
		});
	}

	normalizeAxisX([chartUsers,chartPlaces,chartConvers]);

	var chart = new Chartist.Line('.chartStats', {
	  series: [
	    {
	      data: chartUsers
	    },
	    {
	      data: chartPlaces
	    },
	    {
	      data: chartConvers
	    }	    
	  ]
	}, {
		fullWidth: true,
		height: '160px',
		showPoint: false,
		showArea: true,
		chartPadding: {
			left: 0,
			right: 0,
		},
		axisY: {
			//showGrid: false
		},
		axisX: {
			showGrid: false,
			type: Chartist.FixedScaleAxis,
			divisor: 6,
			labelInterpolationFnc: function(d) {
			  var s = (new Date(d)).toDateString().split(' ')
			  return s[1];
			}
		}
	});
});

});
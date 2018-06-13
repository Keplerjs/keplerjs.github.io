

var host = 'https://demo.keplerjs.io';

var $ = jQuery = require('jquery');
var _ = require('underscore');

var L = require('leaflet');
var Chartist = require('chartist');

var d3 = require('d3');
var d3L = require('@asymmetrik/leaflet-d3');

require('../node_modules/leaflet/dist/leaflet.css');
require('../node_modules/chartist/dist/chartist.css');

$(function() {

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

//
//https://github.com/Asymmetrik/leaflet-d3
//http://jsfiddle.net/reblace/acjnbu8t/?utm_source=website&utm_medium=embed&utm_campaign=acjnbu8t
//
var hexPlacesLayer = L.hexbinLayer({
		radius: 20,
		opacity: 0.9,
		//colorScaleExtent: [ 1, undefined ],
		//radiusScaleExtent: [ 1, undefined ],
		colorRange: ['#d4dcd0','#225577'],
		radiusRange: [6, 12]
	})
	.colorValue(function(d) {
		return d.length*3;
	})
	.radiusValue(function(d) {
		return d.length;
	});

var hexUsersLayer = L.hexbinLayer({
		radius: 10,
		opacity: 0.9,
		//colorScaleExtent: [ 1, undefined ],
		//radiusScaleExtent: [ 1, undefined ],
		colorRange: ['#eacda0','#ff8833'],
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
		url: host+'/stats/places',
	    jsonp: 'jsonp', dataType: 'jsonp',
	    timeout: 1000
	}),
	$.ajax({
		url: host+'/stats/users',
	    jsonp: 'jsonp', dataType: 'jsonp',
	    timeout: 1000
	})
).then(function(ret1, ret2, ret3, ret4) {
	var places = ret1[0],
		users = ret2[0];

	var	$places = $('.stats .places')
		$users = $('.stats .users'),
		pval = (places && places.stats && places.stats.count),
		uval = (users && users.stats && users.stats.count);

	$places.html('<big>'+pval+'</big> places');
	$users.html('<big>'+uval+'</big> users ');

	setInterval(function() {
		pingPlacesLayer.ping(places.geojson.features[0].geometry.coordinates, 'pingPlaces');
	}, pingInterval);

	setInterval(function() {
		pingUsersLayer.ping(users.geojson.features[0].geometry.coordinates, 'pingUsers');
	}, pingInterval);

	hexPlacesLayer.data( _.map(places.geojson.features, function(f) {
		return f.geometry.coordinates;
	}) );

	hexUsersLayer.data( _.map(users.geojson.features, function(f) {
		return f.geometry.coordinates;
	}) );

	function fitStats() {
		map.addLayer(geoLayer);
		map.addLayer(hexPlacesLayer);
		map.addLayer(hexUsersLayer);
		map.setView(worldCenter, worldZoom, {animate: false });
	}

	fitStats();

	$('article').on('click', fitStats);	
/*
	$places.on('click', function(e) {
		hexUsersLayer.setOpacity(0);
		map.addLayer(hexPlacesLayer);
	});
	$users.on('click', function(e) {
		hexPlacesLayer.setOpacity(0);
		map.addLayer(hexUsersLayer);
	});*/
});

/* charts */

$.when(
	$.ajax({
		url: host+'/stats/users/count',
	    jsonp: 'jsonp', dataType: 'jsonp',
	    timeout: 1000
	}),
	$.ajax({
		url: host+'/stats/places/count',
	    jsonp: 'jsonp', dataType: 'jsonp',
	    timeout: 1000
	})
).then(function(retUsers, retPlaces) {
	var usersCount = retUsers[0],
		placesCount = retPlaces[0];

	var chartUsers = []
	for(var i in usersCount.stats.rows) {
		chartUsers.push({
			x: new Date(usersCount.stats.rows[i][0]),
			y: usersCount.stats.rows[i][1]
		});
	}

	var chartPlaces = []
	for(var i in placesCount.stats.rows) {
		chartPlaces.push({
			x: new Date(placesCount.stats.rows[i][0]),
			y: placesCount.stats.rows[i][1]
		});
	}

	var chart = new Chartist.Line('.chartStats', {
	  series: [
	    {
	      name: 'New Users',
	      data: chartUsers
	    },
	    {
	      name: 'New Places',
	      data: chartPlaces
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
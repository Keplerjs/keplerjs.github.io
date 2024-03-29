
var baseUrl = window.baseUrl || 'https://kepler-demo.opengeo.tech/api';

var $ = jQuery = require('jquery');
var _ = require('underscore');

var L = require('leaflet');
var Chartist = require('chartist');

var d3 = require('d3');
var d3L = require('@asymmetrik/leaflet-d3');

//var slick = require('slick-carousel');

require('../node_modules/leaflet/dist/leaflet.css');
require('../node_modules/chartist/dist/chartist.css');

//require('../node_modules/slick-carousel/slick/slick.css');
//require('../node_modules/slick-carousel/slick/slick-theme.css');

var worldCenter = [60,0],
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

var	$version = $('.version'),
	$slides = $('#slides'),
	$stats = $('#stats'),
	$legend = $('.chartLegend'),
	$legend2 = $('.chartLegend2'),
	$users = $('<b>',{'class': 'users'}).appendTo($legend),
	$places = $('<b>',{'class': 'places'}).appendTo($legend),
	$convers = $('<b>',{'class': 'convers'}).appendTo($legend),
	$countries = $('<b>',{'class': 'countries'}).appendTo($legend2),
	$languages = $('<b>',{'class': 'languages'}).appendTo($legend2);
	
var geoLayer = L.geoJSON(null, {
	style: {
		weight: 1,
		opacity: 0.3,
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


function fitStats() {
	map.addLayer(geoLayer);
	map.addLayer(hexPlacesLayer);
	map.addLayer(hexUsersLayer);
	map.setView(worldCenter, worldZoom, {animate: false });
	hexPlacesLayer.show();
	hexUsersLayer.show();
}


$.getJSON('https://unpkg.com/geojson-resources@1.1.0/world.json', function(json) {
	geoLayer.addData(json);
});

/* base api */
$.getJSON(baseUrl, function(json) {
	if(json && json.version) {
		$version.text('v'+json.version)
	}
});

/* layers */
$.when(
	$.getJSON(baseUrl+'/stats/places/bygeo'),
	$.getJSON(baseUrl+'/stats/users/bygeo')
).done(function(ret1, ret2) {

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

	fitStats();

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

//https://api.jquery.com/jquery.when/
$.when(
	$.getJSON(baseUrl+'/stats/users/bydate'),
	$.getJSON(baseUrl+'/stats/places/bydate'),
	$.getJSON(baseUrl+'/stats/convers/bydate')
)
.fail(function(a) {
	
	console.log('fail',a);

	$stats.height(60);
})
.done(function(ret1, ret2, ret3) {

	var usersByDate = ret1[0],
		placesByDate = ret2[0],
		conversByDate = ret3[0];

	$users.html('<big>'+usersByDate.count+'</big> users');
	$places.html('<big>'+placesByDate.count+'</big> places');	
	$convers.html('<big>'+conversByDate.count+'</big> talks');

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

	new Chartist.Line('.chartStats', {
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
		showPoint: false,
		showArea: true,
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

$.when(
	$.getJSON(baseUrl+'/stats/places/byfield/geoinfo.naz'),
	$.getJSON(baseUrl+'/stats/users/byfield/lang')
	//TODO other charts
).done(function(ret1,ret2) {

	var placesByField = ret1[0],
		usersByField = ret2[0];

	$countries.html('<big>'+placesByField.rows.length+'</big> places countries');
	$languages.html('<big>'+usersByField.rows.length+'</big> users languages');

	var limit = 15,
		minval = 5,
		labels = [],
		series = [];

	var tot = 0;//placesByField.count;
		otherlab = 'Others',
		otherval = 0;
	
	var placesLimit = _.filter(placesByField.rows, function(o) {
		return o[1] > minval;
	}).length;

	for(var i in placesByField.rows) {
		let lab = placesByField.rows[i][0],
			val = placesByField.rows[i][1];

		if(lab==='united kingdom')
			lab = 'UK';

		if(i < placesLimit) {
			labels.push(lab);
			series.push(val);
		}
		else
			otherval += val;
		
		tot += val;
	}

	labels.push(otherlab);
	series.push(otherval);

	var chart = new Chartist.Pie('.chartStats2', {
		labels: labels,
		series: series
	}, {
		donut: true,
		donutWidth: 30,
		donutSolid: true,
		//startAngle: 270,
		total: tot,
		showLabel: true,
    	labelOffset: 20,
		labelDirection: 'explode',

		fullWidth: true,
		showPoint: false,
		showArea: true,
		chartPadding: 30,
	});

//USERS

	var usersLimit = 10,
		minval =  15,
		labels = [],
		series = [];

	var tot = 0,
		otherlab = 'Others',
		otherval = 0;

	var usersLimit = _.filter(placesByField.rows, function(o) {
		return o[1] > minval;
	}).length;

	for(var i in usersByField.rows) {
		let lab = usersByField.rows[i][0],
			val = usersByField.rows[i][1];

		if(i < usersLimit) {
			labels.push(lab);
			series.push(val);
		}
		else
			otherval += val;
		
		tot += val;
	}

	labels.push(otherlab);
	series.push(otherval);

	new Chartist.Pie('.chartStats3', {
		labels: labels,
		series: series
	}, {
		donut: true,
		donutWidth: 30,
		donutSolid: true,
		total: tot,
		showLabel: true,
    	labelOffset: 10,
		labelDirection: 'explode',

		fullWidth: true,
		showPoint: false,
		showArea: true,
		chartPadding: 30,
	});
});

// https://github.com/kenwheeler/slick
/*
if(slick)
$slides.slick({
	autoplay: true,
	slidesPerRow: 5,
	adaptiveHeight: false,
	autoplaySpeed: 2000,
	centerMode: false,
	arrows: false,
	dots: true
});*/
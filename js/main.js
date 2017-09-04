
var map = L.map('map', {
	center:[62.3087, -5.9765],
	zoom:3,
	minZoom:3,
	boxZoom: false,
	trackResize:true,
	//dragging: false,
	keyboard: false,
	scrollWheelZoom:false,
	//doubleClickZoom:false,
	attributionControl: false,
	zoomControl: false,
}).fitWorld();


var stats = L.featureGroup().addTo(map);

var host = 'https://demo.keplerjs.io';

$.when(
	$.getJSON('https://unpkg.com/geojson-resources@1.1.0/world.json'),
	$.ajax({
		url: host+'/stats/places',
	    jsonp: 'jsonp', dataType: 'jsonp'
	}),
	$.ajax({
		url: host+'/stats/users',
	    jsonp: 'jsonp', dataType: 'jsonp'
	})	
)
.then(function(ret0, ret1, ret2) {
	var base = ret0[0],
		places = ret1[0],
		users = ret2[0];

	$('.stats .places').html('<big>'+(places && places.features && places.features.length)+'</big> places');
	$('.stats .users').html('<big>'+(users && users.features && users.features.length)+'</big> users');

	L.geoJSON(base, {
		style: {
			weight:1,
			fillColor:'#99cc00',
			opacity:0.3,
			fillOpacity:0.1,
			color:'#99cc00'
		}
	}).addTo(map);

	var i=0;
	var lplaces = L.geoJSON(places, {
		pointToLayer: function(point, loc) {
			var r = point.properties.rank;
			r = Math.min(r, 30);
			r = Math.max(r, 3);

			if(++i==1) {	//the latest created
				return L.marker(loc, {
					icon: L.icon.pulse({
						heartbeat: 2,
						iconSize: [8,8],
						color:'#225577'
					})
				})
			}
			else
				return L.circleMarker(loc, {radius: r })
		},
		style: {
			weight:0,
			fillOpacity:0.5,
			fillColor:'#225577',
			color:'#225577'
		}
	}).addTo(stats);

	//users 

	users.features = users.features.filter(function(f) {
		return f.geometry.coordinates.length;
	});

	var i=0;
	var lusers = L.geoJSON(users, {
		pointToLayer: function(point, loc) {
			var r = point.properties.rank;
			r = Math.min(r, 3);
			r = Math.max(r, 2);

			if(++i==1) {	//the latest created
				return L.marker(loc, {
					icon: L.icon.pulse({
						heartbeat: 2,
						iconSize: [8, 8],
						color:'#ff7b24'
					})
				})
			}
			else
				return L.circleMarker(loc, {radius: r })		
		},
		style: {
			weight:0,
			fillOpacity:1,
			fillColor:'#ff7b24',
			color:'#ff7b24'
		}
	}).addTo(stats);

	var bb = stats.getBounds(),
		center = bb.getCenter(),
		zoom = map.getBoundsZoom(bb)+1;

	map.fitBounds(bb, {
		//maxZoom:3,
		paddingTopLeft: L.point(0,600),
		paddingBottomRight: L.point(300,0),
		animate:false
	}).setZoom(zoom,{animate:false});
});

$(function() {
	map.invalidateSize(false)
});

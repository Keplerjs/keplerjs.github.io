
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
	$.getJSON('https://raw.githubusercontent.com/stefanocudini/GeoJSONResources/master/world.json'),
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

	$('.stats .places big').text(places && places.features && places.features.length);
	$('.stats .users big').text(users && users.features && users.features.length);

	L.geoJSON(base, {
		style: {
			weight:1,
			fillColor:'#99cc00',
			opacity:0.3,
			fillOpacity:0.1,
			color:'#99cc00'
		}
	}).addTo(map);

	var lplaces = L.geoJSON(places, {
		pointToLayer: function(point, ll) {
			var r = point.properties.rank;
/*			r = Math.min(r, 20);
			r = Math.max(r, 2);*/
			return L.circleMarker(ll, {radius: r })
		},
		style: {
			weight:0,
			fillOpacity:0.2,
			fillColor:'#225577',
			color:'#225577'
		}
	}).addTo(stats);

	users.features = users.features.filter(function(f) {
		return f.geometry.coordinates.length;
	});

	users.features.map(function(f) {
		console.log(f.geometry.coordinates, f.properties.rank)
	})

	var lusers = L.geoJSON(users, {
		pointToLayer: function(point, ll) {
			var r = point.properties.rank;
			r = Math.min(r, 4);
			r = Math.max(r, 2);
			return L.circleMarker(ll, {radius: r });
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
	});
	map.setZoom(zoom,{animate:false})
});


$(function() {
	map.invalidateSize(false)
});
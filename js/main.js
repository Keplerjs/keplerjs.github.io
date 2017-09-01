
var map = L.map('map', {
	center:[10,10],
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

$.getJSON('https://raw.githubusercontent.com/stefanocudini/GeoJSONResources/master/world.json', function(data) {
	L.geoJSON(data, {
		style: {
			weight:1,
			fillColor:'#99cc00',
			opacity:0.3,
			fillOpacity:0.1,
			color:'#99cc00'
		}
	}).addTo(map);
});
var stats = L.featureGroup().addTo(map);

$.when(
	$.ajax({
		url: 'https://demo.keplerjs.io/stats/places',
	    jsonp: 'jsonp', dataType: 'jsonp'
	}),
	$.ajax({
		url: 'https://demo.keplerjs.io/stats/users',
	    jsonp: 'jsonp', dataType: 'jsonp'
	})	
)
.then(function(ret1, ret2) {
	var places = ret1[0],
		users = ret2[0];

	$('.stats .places big').text(places && places.features && places.features.length);
	$('.stats .users big').text(users && users.features && users.features.length);

	var lplaces = L.geoJSON(places, {
		pointToLayer: function(point, ll) {
			var r = point.properties.rank
			r = Math.min(r, 21);
			r = Math.max(r, 6);
			return L.circleMarker(ll, {radius: r})
		},
		style: {
			weight:0,
			fillOpacity:0.2,
			fillColor:'#225577',
			color:'#225577'
		}
	}).addTo(stats);

	users.features = users.features.filter(function(f) {
		return !!f.geometry.coordinates[0];
	});

	var lusers = L.geoJSON(users, {
		pointToLayer: function(point, ll) {
			var r = point.properties.rank
			r = Math.min(r, 3);
			r = Math.max(r, 2);
			return L.circleMarker(ll, {radius: r})
		},
		style: {
			weight:0,
			fillOpacity:1,
			fillColor:'#ff7b24',
			color:'#ff7b24'
		}
	}).addTo(stats);

	map.fitBounds(stats.getBounds(), {
		maxZoom:3,
		paddingTopLeft: L.point(0,800),
		paddingBottomRight: L.point(200,100),		
	});
});


$(function() {
	map.invalidateSize(false)
});

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
	    jsonp: 'jsonp', dataType: 'jsonp',
	    timeout: 1000
	}),
	$.ajax({
		url: host+'/stats/users',
	    jsonp: 'jsonp', dataType: 'jsonp',
	    timeout: 1000
	})	
)
.then(function(ret0, ret1, ret2) {
	var base = ret0[0],
		places = ret1[0],
		users = ret2[0],
		$places = $('.stats .places')
		$users = $('.stats .users');

	$places.html('<big>'+(places && places.features && places.features.length)+'</big> places');
	$users.html('<big>'+(users && users.features && users.features.length)+'</big> users');

	L.geoJSON(base, {
		style: {
			weight:1,
			fillColor:'#9c0',
			opacity:0.3,
			fillOpacity:0.1,
			color:'#9c0'
		}
	}).addTo(map);

	var i = 0;
	var bbplaces = L.latLngBounds();
	var lplaces = L.geoJSON(places, {
		pointToLayer: function(point, loc) {
			var r = point.properties.rank;
			r = Math.min(r, 30);
			r = Math.max(r, 3);

			bbplaces.extend(loc);

			if(++i==1) {	//the latest created
				return L.marker(loc, {
					icon: L.icon.pulse({
						heartbeat: 2,
						iconSize: [8,8],
						color:'#257'
					})
				})
			}
			else
				return L.circleMarker(loc, {radius: r })
		},
		style: {
			weight:0,
			fillOpacity:0.5,
			fillColor:'#257',
			color:'#257'
		}
	});

	//users 

	users.features = users.features.filter(function(f) {
		return f.geometry.coordinates.length;
	});

	var i = 0;
	var bbusers = L.latLngBounds();
	var lusers = L.geoJSON(users, {
		pointToLayer: function(point, loc) {
			var r = point.properties.rank;
			r = Math.min(r, 3);
			r = Math.max(r, 2);
			
			if(r>2)
				bbusers.extend(loc);

			if(++i==1) {	//the latest created
				return L.marker(loc, {
					icon: L.icon.pulse({
						heartbeat: 2,
						iconSize: [8, 8],
						color:'#f72'
					})
				})
			}
			else
				return L.circleMarker(loc, {radius: r })		
		},
		style: {
			weight:0,
			fillOpacity:1,
			fillColor:'#f72',
			color:'#f72'
		}
	});

	function fitStats(anim) {
		anim = !!anim;
		stats.removeLayer(lusers);
		stats.removeLayer(lplaces);		
		stats.addLayer(lplaces);
		stats.addLayer(lusers);

		//var bb = stats.getBounds(),
		//
		var bb = L.latLngBounds().extend(bbplaces).extend(bbusers);

		//center = bb.getCenter(),
		//zoom = map.getBoundsZoom(bb);

		map.fitBounds(bb, {
			paddingTopLeft: L.point(300,600),
			paddingBottomRight: L.point(400,0),
			animate: anim
		})
		//.setZoom(zoom,{animate: anim});
	}

	fitStats();

	$places.on('click', function(e) {
		stats.removeLayer(lusers);
		stats.removeLayer(lplaces);
		map.once('zoomend moveend', function(e) {
			stats.addLayer(lplaces);
		});
		map.flyToBounds(bbplaces, {
			paddingTopLeft: L.point(0,100),
			paddingBottomRight: L.point(300,0)
		});
	});
	$users.on('click', function(e) {
		
		stats.removeLayer(lusers);
		stats.removeLayer(lplaces);
		map.once('zoomend moveend', function(e) {
			stats.addLayer(lusers);
		});		
		map.flyToBounds(bbusers, {
			paddingTopLeft: L.point(0,600),
			paddingBottomRight: L.point(300,0)
		});
	});
	$('article').on('click', fitStats)
	//*/
});

$(function() {
	map.invalidateSize(false)
});

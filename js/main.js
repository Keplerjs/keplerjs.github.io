
var map = L.map('map', {
	center:[62.3087, -5.9765],
	zoom:3,
	minZoom:3,
	boxZoom: false,
	trackResize:true,
	//dragging: false,
	//keyboard: false,
	scrollWheelZoom:false,
	//doubleClickZoom:false,
	attributionControl: false,
	zoomControl: false,
}).fitWorld();


var stats = L.featureGroup().addTo(map);

var host = 'https://demo.keplerjs.local';

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
	}),
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
)
.then(function(ret0, ret1, ret2, ret3, ret4) {
	var base = ret0[0],
		places = ret1[0],
		users = ret2[0],
		usersCount = ret3[0],
		placesCount = ret4[0];

	var	$places = $('.stats .places')
		$users = $('.stats .users');

	$places.html('<big>'+(places && places.stats && places.stats.count)+'</big> places');
	$users.html('<big>'+(users && users.stats && users.stats.count)+'</big> users');

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
	var lplaces = L.geoJSON(places.geojson, {
		pointToLayer: function(point, loc) {
			var r = point.properties.rank;
			r = Math.min(r, 15);
			r = Math.max(r, 5);

			if(r>5)
				bbplaces.extend(loc);
			//TODO calc bbox server side
			//
			var icon = L.icon.pulse({
				heartbeat: 2,
				iconSize: [8,8],
				color:'#257'
			});

			if(++i==1) {	//the latest created
				return L.marker(loc, {
					icon: icon
				})
			}
			else
				return L.circleMarker(loc, {radius: r })
		},
		style: {
			weight:0,
			fillOpacity:0.3,
			fillColor:'#257',
			color:'#257'
		}
	});

	//users 
	users.geojson.features = users.geojson.features.filter(function(f) {
		return f.geometry.coordinates.length;
	});

	var i = 0;
	var bbusers = L.latLngBounds();
	var lusers = L.geoJSON(users.geojson, {
		pointToLayer: function(point, loc) {
			var r = point.properties.rank;
			r = Math.min(r, 4);
			r = Math.max(r, 2);
			
			if(r>3)
				bbusers.extend(loc);
			//TODO calc bbox server side
			
			var icon = L.icon.pulse({
				heartbeat: 2,
				iconSize: [8, 8],
				color:'#f83'
			});

			if(++i==1) {	//the latest created
				return L.marker(loc, {
					icon: icon
				})
			}
			else
				return L.circleMarker(loc, {radius: r })		
		},
		style: {
			weight:0,
			opacity:0.8,
			fillOpacity:1,
			fillColor:'#f83',
			color:'#f61'
		}
	});

	function getPadding(anim) {
		var sOffset = $('.stats').offset();
		return {
			animate:anim,
			paddingTopLeft: L.point((sOffset.left/3),300+sOffset.top/2),
			paddingBottomRight: L.point(200,0)
		}
	}

	function fitStats() {
		stats.removeLayer(lusers);
		stats.removeLayer(lplaces);		
		stats.addLayer(lplaces);
		stats.addLayer(lusers);

		//var bb = stats.getBounds();
		//var bb = L.latLngBounds().extend(bbplaces).extend(bbusers);
		var bb = L.latLngBounds()
			.extend(bbplaces)
			.extend(bbusers)
			//.extend(lplaces.getBounds())
			//.extend(lusers.getBounds());

		map.fitBounds(bb, getPadding(false) );

		var c = bb.getCenter(),
			z = map.getBoundsZoom(bb);
		//map.setView(c, z+1, getPadding() );
		//map.setZoom(z)
		map.zoomIn(1,{animate:false});
	}

	fitStats();

	$places.on('click', function(e) {
		stats.removeLayer(lusers);
		stats.removeLayer(lplaces);
		map.once('zoomend moveend', function(e) {
			stats.addLayer(lplaces);
		});
		map.flyToBounds(bbplaces, getPadding());
	});
	$users.on('click', function(e) {
		
		stats.removeLayer(lusers);
		stats.removeLayer(lplaces);
		map.once('zoomend moveend', function(e) {
			stats.addLayer(lusers);
		});		
		map.flyToBounds(bbusers, getPadding());
	});
	$('article').on('click', function() {
		fitStats();
	});

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

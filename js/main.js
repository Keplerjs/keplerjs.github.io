$(function() {

var host = 'https://demo.keplerjs.io';

var map = L.map('map', {
	center:[40,0],
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

var geoLayer = L.geoJSON(null, {
	style: {
		weight: 1,
		opacity: 0.3,
		color:'#9c0',
		fillColor:'#9c0',
		fillOpacity: 0.1
	}
}).addTo(map);

var statsLayer = L.featureGroup().addTo(map);

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

	var i = 0;
	var bbplaces = L.latLngBounds();
	var lplaces = L.geoJSON(places.geojson, {
		pointToLayer: function(point, loc) {
			var r = point.properties.rank;
			r = Math.min(r, 12);
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
			r = Math.min(r, 3);
			r = Math.max(r, 1);
			
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
		statsLayer.removeLayer(lusers);
		statsLayer.removeLayer(lplaces);		
		statsLayer.addLayer(lplaces);
		statsLayer.addLayer(lusers);
/*
		//var bb = statsLayer.getBounds();
		//var bb = L.latLngBounds().extend(bbplaces).extend(bbusers);
		var bb = L.latLngBounds()
			.extend(bbplaces)
			.extend(bbusers)
			//.extend(lplaces.getBounds())
			//.extend(lusers.getBounds());

		map.fitBounds(bb, getPadding(false) );

		var c = bb.getCenter(),
			z = map.getBoundsZoom(bb);*/
		map.setView([40,0], 3, {animate:false} );
		//map.setZoom(z)
		//map.zoomIn(1,{animate:false});
	}

	fitStats();

	$places.on('click', function(e) {
		statsLayer.removeLayer(lusers);
		statsLayer.removeLayer(lplaces);
		map.once('zoomend moveend', function(e) {
			statsLayer.addLayer(lplaces);
		});
		map.flyToBounds(bbplaces);
	});
	$users.on('click', function(e) {
		
		statsLayer.removeLayer(lusers);
		statsLayer.removeLayer(lplaces);
		map.once('zoomend moveend', function(e) {
			statsLayer.addLayer(lusers);
		});		
		map.flyToBounds(bbusers);
	});
	$('article').on('click', function() {
		fitStats();
	});
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
).then(function(ret3, ret4) {
	var usersCount = ret3[0],
		placesCount = ret4[0];

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
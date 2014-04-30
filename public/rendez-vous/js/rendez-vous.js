// to do: add speed, number of red lights
// or extract from the making-of video

var data = updatedCoords;
var map, marker, panorama, track, interval;

jQuery(document).ready(function(){
	// created in video loadedmetadata handler
	var video = document.querySelector("video");

	if (typeof video.addTextTrack != "undefined") {
		track = setup(video, panorama, data);
		jQuery(".trackNotSupported").hide();
		jQuery("#videoContainer").fadeTo(2000, 1);

		jQuery('#fullScreen').on("click", function(e){
			goFullScreen();
		});

		video.ontimeupdate = function(e){
			var currentTime = video.currentTime;
			var activeCues = this.textTracks[0].activeCues;
			if (cue = activeCues[0]){
				var cueData = JSON.parse(cue.text);
				var newLatLng = calculateIntermediatePosition(cueData, currentTime);
				map.panTo(newLatLng);
			}
		};
	}
});

function calculateIntermediatePosition(cueData, currentTime){

	var i = cueData.i;

	var timeLastCoord = cueData.t;
	var lastLat = cueData.lat;
	var lastLng = cueData.lng;

	var nextCue = data[i + 1];

	var timeNextCoord = nextCue.t;
	var segmentLength = timeNextCoord - timeLastCoord;
	var elapsedTime = currentTime - timeLastCoord;
	var ratio = elapsedTime / segmentLength;

	var lastLat = Number(cueData.lat);
	var nextLat = Number(nextCue.lat);
	var latDiff = nextLat - lastLat;
	var instantLat = lastLat + latDiff * ratio;

	var lastLng = Number(cueData.lng);
	var nextLng = Number(nextCue.lng);
	var lngDiff = nextLng - lastLng;
	var instantLng = lastLng + lngDiff * ratio;

	var newLatLng = new google.maps.LatLng(instantLat, instantLng);

	return newLatLng;
}

function setup(video, panorama, data){
	// need wait for video to load before creating track,
	var track;
	video.addEventListener("loadedmetadata", function(){
		var videoOffset = 1331362993;
		track = video.addTextTrack("metadata", "GMaps data", "en");
		track.mode = "hidden";
		result = init(data, track, video, panorama);
		map = result[0];
		panorama = result[1];
		marker = result[2];

		track.oncuechange = function(){
			onCueChange(this, map, panorama);
		}
	});
	return track;
}

function onCueChange(textTrack, map, panorama){
	var cue = textTrack.activeCues[0]; // there is only one active cue in this example
	if (typeof cue === "undefined") {
		return;
	}
	var point = JSON.parse(cue.text);
	var i = point.i;

	var heading;
	var previousPoint = data[i - 1];

	if (previousPoint){
		var oldLatLng = new google.maps.LatLng(previousPoint.lat, previousPoint.lng);
		var newLatLng = new google.maps.LatLng(point.lat, point.lng);
		heading = getHeading(oldLatLng, newLatLng);
	}

	var pov = {
		"heading": heading,
		"pitch": panorama.getPov().pitch,
		"zoom": panorama.getPov().zoom
	}
	panorama.setPov(pov);
	panorama.setPosition(newLatLng);
	// marker.setPosition(newLatLng);
}

function init(points, track, video, map, panorama, marker){
	JSONtoTrackCues(track, points, 0, video);

	console.log(track);

	var startLatLng = new google.maps.LatLng(points[0].lat, points[0].lng);

	var map = createMap(startLatLng)
	panorama = createPanorama(startLatLng, document.getElementById("panorama"));
	map.setStreetView(panorama);

	// var path = [];
	// points.forEach(function(point){
	// 	path.push(new google.maps.LatLng(point.lat, point.lng));
	// });
	// setPolyline(path, map);

	// marker = new google.maps.Marker({
	// 	position: new google.maps.LatLng(points[0].lat, points[0].lng),
	// 	map: map,
	// 	title:"gbike!"
	// });
	return [map, panorama, marker];
}

function JSONtoTrackCues(track, points, videoOffset, video){
	var videoOffset = videoOffset || 0;

	points.forEach(function(point, i){
		var startTime = point.t - videoOffset; //video offset for mapTracks video, remove for rendez-vous
		var endTime;
		if (points[i+1]) {
			endTime = points[i+1].t - videoOffset;
		} else {
			endTime = video.duration;
		}

		track.addCue(new (window.VTTCue || window.TextTrackCue)(startTime, endTime, JSON.stringify(point))); // change in spec
	});
}

function createMap(startLatLng){
	var options = {
		center: startLatLng,
		zoom: 18,
		mapTypeId: google.maps.MapTypeId.SATELLITE,
		disableDefaultUI: true
	};

	var map = new google.maps.Map(document.getElementById("map"), options);
	return map
}

function createPanorama(startLatLng, targetEl){
	var panoramaOptions = {
		position: startLatLng,
		pov: {
			heading: 37, // hack :)
			pitch: 10,
			zoom: 0
		},
		addressControl: false,
		linksControl: false,
		panControl: false,
		zoomControl: false,
		enableCloseButton: false
	};
	var panorama = new google.maps.StreetViewPanorama(document.getElementById("panorama"), panoramaOptions);
	return panorama;
}

function setPolyline (path, map){
	var polyline = new google.maps.Polyline({
		path: path,
		strokeColor: "#ff0000",
		strokeOpacity: 0.2,
		strokeWeight: 5
	});
	polyline.setMap(map);
}

function degreesToRadians(deg) {
  return deg * (Math.PI / 180);
}

// Adapted from http://econym.org.uk/gmap/example_dist.htm
// Returns the bearing in degrees between two points. (North = 0, East = 90, ...)

function getHeading(from, to) {
	// Convert to radians.
	var lat1 = degreesToRadians(from.lat());
	var lon1 = degreesToRadians(from.lng());
	var lat2 = degreesToRadians(to.lat());
	var lon2 = degreesToRadians(to.lng());

	// Compute the angle.
	var angle = - Math.atan2( Math.sin( lon1 - lon2 ) * Math.cos( lat2 ), Math.cos( lat1 ) * Math.sin( lat2 ) - Math.sin( lat1 ) * Math.cos( lat2 ) * Math.cos( lon1 - lon2 ) );
	if ( angle < 0.0 ) {
		angle  += Math.PI * 2.0;
	}

	// And convert result to degrees.
	var degreesPerRadian = 180.0 / Math.PI;
	angle = angle * degreesPerRadian;
	angle = angle.toFixed(1);

	return parseInt(angle);
}

function calculatePosition(){

}


function launchFullScreen(element) {
  if(element.requestFullscreen) {
    element.requestFullscreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if(element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if(element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}
function goFullScreen(){
	launchFullScreen(document.getElementById("videoContainer")); // any individual element
}

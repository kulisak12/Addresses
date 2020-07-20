function showAddresses(people) {
	var markerLayer = addMap();

	people.forEach(function(person) {
		// send address resole request
		new SMap.Geocoder(person.address, function(response) {
			addMarker(markerLayer, person.name, response);
		});
	});
}

function addMap() {
	// create base map
	var center = SMap.Coords.fromWGS84(14.385, 50.106);
	var m = new SMap(JAK.gel("m"), center, 13);
	m.addDefaultLayer(SMap.DEF_BASE).enable();
	m.addDefaultControls();
	
	// add marker layer
	var layer = new SMap.Layer.Marker();
	m.addLayer(layer);
	layer.enable();

	return layer;
}

// callback for geocoder request
function addMarker(markerLayer, name, geocoder) {
    if (geocoder.getResults()[0].results.length == 0) {
        document.getElementById("error").innerHTML += "Neznámá adresa: " + geocoder.getResults()[0].query + "<br>";
        return;
    }
	var result = geocoder.getResults()[0].results[0];
	
	// marker icon
	var iconDiv = JAK.mel("div");
	var icon = JAK.mel("img", {src: "control.png"});
	iconDiv.appendChild(icon);
	// marker description
	var card = new SMap.Card();
	card.getHeader().innerHTML = name;
	var options = { 
		title: name,
		url: iconDiv
	};

	// create marker
	var marker = new SMap.Marker(result.coords, false, options);
	marker.decorate(SMap.Marker.Feature.Card, card);
	markerLayer.addMarker(marker);
}

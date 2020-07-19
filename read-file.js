// check uploaded file
function getFile() {
	var file = document.getElementById("file").files[0];
	
	if (file == null) {
		return;
	}

	if (file.name.endsWith(".vcf")) {
		readFile(file, vcfParser);
	}
	else { // unsupported format
		document.getElementById("error").innerHTML = "Please upload a .vcf file.";
		return;
	}
}

// extract content
function readFile(file, parser) {
	var reader = new FileReader();
	reader.onload = function() {
		var people = parser(reader.result);
		document.getElementById("error").innerHTML = "";
		document.getElementById("file").value = "";
		showAddresses(people);
	};
	reader.readAsText(file);
}

// parse .vcf format
function vcfParser(fileContent) {
	var people = [];
	var entries = fileContent.split("BEGIN:VCARD");
	// parse person
	entries.forEach(function(entry) {
		// get display name
		var namePos = entry.indexOf("FN:");
		if (namePos == -1) {
			return;
		}
		var name = entry.substr(namePos + 3);
		name = name.substr(0, name.indexOf("\n"));
		
		// get address
		var addrPos = entry.indexOf("ADR");
		if (addrPos == -1) {
			return;
		}
		var address = entry.substr(addrPos + 16);
		address = address.substr(0, address.indexOf(";;;"));
		
		var person = {
			name: name,
			address: fixAddress(address)
		};
		people.push(person);
	});
	return people;
}

// try to make the address recognizable
function fixAddress(address) {
	// remove postal code
	address = address.replace(/\d\d\d ?\d\d/g, "");
	// remove district
	var districtPos = address.indexOf("-");
	if (districtPos != -1) {
		var district = address.substr(districtPos + 2);
		var districtEnd = district.search(/[ ;,]/g);
		district = (districtEnd == -1) ? address.substr(districtPos) : address.substr(districtPos, districtEnd + 2);
		address = address.replace(district, "");
	}
	return address;
}
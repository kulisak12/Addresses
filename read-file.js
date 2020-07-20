// check uploaded file
function getFile() {
	var file = document.getElementById("file").files[0];
	
	if (file == null) {
		return;
	}

	if (file.name.endsWith(".vcf")) {
		readTextFile(file, vcfParser);
	}
	else if (file.name.endsWith(".xls") || file.name.endsWith(".xlsx")) {
		readExcelFile(file);
	}
	else { // unsupported format
		document.getElementById("error").innerHTML = "Please upload a .vcf file.";
		return;
	}
}

// extract file content
function readTextFile(file, parser) {
	var reader = new FileReader();
	reader.onload = function() {
		var people = parser(reader.result);
		finishFileRead(people);
	};
	reader.readAsText(file);
}

function readExcelFile(file) {
	var reader = new FileReader();
	reader.onload = function() {
		var data = new Uint8Array(reader.result);
		var workbook = XLSX.read(data, {type: 'array'});
		var people = getPeopleFromExcel(workbook);
		finishFileRead(people);
	};
	reader.readAsArrayBuffer(file);
}

// change view from file upload to map
function finishFileRead(people) {
	document.getElementById("error").innerHTML = "";
	document.getElementById("file").style.display = "none";
	showAddresses(people);
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

// collect information from excel spreadsheet
function getPeopleFromExcel(workbook) {
	var sheetName = workbook.SheetNames[0];
	var sheet = workbook.Sheets[sheetName];
	var range = XLSX.utils.decode_range(sheet["!ref"]);
	var indexes = getColumnIndexes(sheet);
	var lastYear = maxYear(sheet, indexes.year);

	var people = [];
	for (var row = 1; row <= range.e.r; row++) {
		// skip those unregistered for this year
		if (parseInt(getCellValue(sheet, indexes.year, row)) != lastYear) {
			//continue;
		}
		// handle person
		var person = {};
		person.name = getCellValue(sheet, indexes.name, row) + " " + 
			getCellValue(sheet, indexes.surname, row);
		person.address = getCellValue(sheet, indexes.street, row) + ", " +
			getCellValue(sheet, indexes.city, row);
		// only add if everything is defined
		if (person.name.indexOf("undefined") == -1 || person.address.indexOf("undefined") == -1) {
			people.push(person);
		}
	}
	return people;
}

// convert A1 notation to col and row numbers
function getCellRef(col, row) {
	return XLSX.utils.encode_cell({c: col, r: row});
}

function getCellValue(sheet, col, row) {
	var cell = sheet[getCellRef(col, row)];
	if (cell == undefined) {
		return undefined;
	}
	return sheet[getCellRef(col, row)].v;
}

// where to find name and address
function getColumnIndexes(sheet) {
	var range = XLSX.utils.decode_range(sheet["!ref"]);
	var indexes = {};
	for (var col = 0; col <= range.e.c; col++) {
		var value = getCellValue(sheet, col, 0);
		if (value == undefined) {
			continue;
		}
		else if (value == "Jméno") {
			indexes.name = col;
		}
		else if (value == "Příjmení") {
			indexes.surname = col;
		}
		else if (value == "Ulice a číslo popisné") {
			indexes.street = col;
		}
		else if (value == "Město") {
			indexes.city = col;
		}
		else if (value == "Poslední rok registrace v: OB") {
			indexes.year = col;
		}
	}
	return indexes;
}

// find the max year value to determine current year
function maxYear(sheet, yearCol) {
	var range = XLSX.utils.decode_range(sheet["!ref"]);
	var year = 0;
	for (var row = 1; row <= range.e.r; row++) {
		var value = parseInt(getCellValue(sheet, yearCol, row));
		if (value > year) {
			year = value;
		}
	}
	return year;
}
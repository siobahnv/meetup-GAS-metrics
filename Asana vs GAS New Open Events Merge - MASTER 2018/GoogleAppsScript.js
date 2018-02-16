// --------------------------------------------------------------------------------------
// --------ENTIRE DOC--------------------------------------------------------------------
// --------Set Column Value of Selected Sheet--------------------------------------------
// --------------------------------------------------------------------------------------

// See: https://stackoverflow.com/questions/31214352/how-to-use-a-column-header-to-reference-a-cell-in-google-apps-script-spreadsheet
function getColByNameFromSheet(sheet, headerName) {
    var headers = sheet.getDataRange().getValues().shift();
    var colindex = headers.indexOf(headerName);
    return colindex + 1;
}

// --------------------------------------------------------------------------------------
// --------Duplicate Checking-------------------------------------------------------------
// --------------------------------------------------------------------------------------

function isDuplicateEvent(currentEventEntry, currentIDsList) {

    for (var check = 0; check < currentIDsList.length; check++) {
        if (currentEventEntry.id == currentIDsList[check]) {
            return true;
        };
    };

    return false;
}


// --------------------------------------------------------------------------------------
// --------Create Region Dictionaries----------------------------------------------------
// --------------------------------------------------------------------------------------


function createRegionDictionary() {
    var countryRegionObject = {};
    for (count = 0; count < countryLISTisoA2.length; count++) {
        var ISOA2 = countryLISTisoA2[count][0].toLowerCase();
        if (countryLISTregion[count][0]) {
            countryRegionObject[ISOA2] = countryLISTregion[count][0];
        } else {
            countryRegionObject[ISOA2] = "Undefined Region";
        }
    };
    return countryRegionObject;
};

function createUSsubRegionDictionary() {
    var stateRegionObject = {};
    for (count = 0; count < stateLISTabbrev.length; count++) {
        var state = stateLISTabbrev[count][0].toLowerCase();
        if (stateLISTregion[count][0]) {
            stateRegionObject[state] = stateLISTregion[count][0];
        } else {
            stateRegionObject[state] = "Undefined Region";
        }
    };
    return stateRegionObject;
};

function createCAsubRegionDictionary() {
    var provinceRegionObject = {};
    for (count = 0; count < provinceLISTabbrev.length; count++) {
        var province = provinceLISTabbrev[count][0].toLowerCase();
        if (provinceLISTregion[count][0]) {
            provinceRegionObject[province] = provinceLISTregion[count][0];
        } else {
            provinceRegionObject[province] = "Undefined Region";
        }
    };
    return provinceRegionObject;
};


// --------------------------------------------------------------------------------------
// --------Add to Google Spreadsheet-------------------------------------------------------------
// --------------------------------------------------------------------------------------
function addToGoogleSheet(currentEventEntry, keyword) {

    // TIME TO AVOID DUPLICATION - Get our column to check against
    // Needs a Sample Row so array/Range isn't empty
    var currentIdsList = SHEET.getSheetValues(2, getColByNameFromSheet(SHEET, "Event ID"), SHEET.getLastRow() - 1, 1);

    //NOTE: currentIdsList is an array of arrays of ids, not an array of ids. This is not true for the Asana function, which just has an array of ids
    if (isDuplicateEvent(currentEventEntry, currentIdsList)) {
        return; //nope, it's a duplicate, we don't want it
    }

    // IF IT PASSES, assign values and append to sheet
    if (currentEventEntry.group) {
        if (currentEventEntry.group.name) {
            var groupName = currentEventEntry.group.name;
        }
        if (currentEventEntry.group.id) {
            var groupID = currentEventEntry.group.id;
        }
    } else {
        var groupName = "";
        var groupID = "";
    };

    if (currentEventEntry.name) {
        var eventTitle = currentEventEntry.name;
    } else {
        var eventTitle = "";
    };

    if (currentEventEntry.id) {
        var eventID = currentEventEntry.id;
    } else {
        var eventID = "";
    };

    if (currentEventEntry.event_url) {
        var eventURL = currentEventEntry.event_url;
    } else {
        var eventURL = "";
    };

    if (currentEventEntry.status) {
        var status = currentEventEntry.status;
    } else {
        var status = "";
    };

    if (currentEventEntry.time) {
        var eventDateAndTime = new Date(currentEventEntry.time);
        var eventDate = eventDateAndTime.toLocaleDateString();
        var eventTime = eventDateAndTime.toLocaleTimeString();
    } else {
        var eventDate = "";
        var eventTime = "";
    };

    // Assign these values "blanks"
    var venueName = "";
    var venueAddress = "";
    var venueCity = "";
    var venueState = "";
    var venueCountry = "";
    var venueLat = "";
    var venueLong = "";
    var venueRegion = "Region:Unknown";
    var venueSubRegion = "";

    // Replace if values exist
    if (currentEventEntry.venue) {
        if (currentEventEntry.venue.name) { venueName = currentEventEntry.venue.name; };
        if (currentEventEntry.venue.address_1) { venueAddress = currentEventEntry.venue.address_1; };
        if (currentEventEntry.venue.city) { venueCity = currentEventEntry.venue.city; };

        if (currentEventEntry.venue.state) {

            var lowerCaseState = currentEventEntry.venue.state.toLowerCase();
            if (currentEventEntry.venue.country) {
                var venueCountry = currentEventEntry.venue.country;
                if (venueCountry == 'us') {
                    var venueSubRegion = regionUSsubDICT[lowerCaseState];
                } else if (venueCountry == 'ca') {
                    var venueSubRegion = regionCAsubDICT[lowerCaseState];
                } else {
                    var venueSubRegion = "Region:Unknown";
                };

            };
        };

        if (currentEventEntry.venue.country) {
            var venueCountryLowerCase = currentEventEntry.venue.country.toLowerCase();
            var venueCountry = venueCountryLowerCase;
            venueRegion = regionDICT[venueCountryLowerCase];
        };

        if (currentEventEntry.venue.lat) { venueLat = currentEventEntry.venue.lat; };
        if (currentEventEntry.venue.lon) { venueLong = currentEventEntry.venue.lon; };
    } // else get address from lat lon of group?

    if (currentEventEntry.yes_rsvp_count) {
        var rsvps = currentEventEntry.yes_rsvp_count;
    } else {
        var rsvps = "";
    }

    // Leaves out other products other than initial query, but it's a start
    var eventProduct = keyword;

    // APPEND DATA - what all this work is for...
    SHEET.appendRow(['', groupName, groupID, eventTitle, eventID, eventURL, status, eventDate, eventTime, venueName, rsvps, '', '', '', venueAddress, venueCity, venueState, venueCountry, venueRegion, venueSubRegion, venueLat, venueLong, '', eventProduct]);
};


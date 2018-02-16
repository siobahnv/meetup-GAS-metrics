// --------------------------------------------------------------------------------------
//      _        _                         _ 
//  ___| |_ __ _| |_ _   _ ___    ___ ___ | |
// / __| __/ _` | __| | | / __|  / __/ _ \| |
// \__ \ || (_| | |_| |_| \__ \ | (_| (_) | |
// |___/\__\__,_|\__|\__,_|___/  \___\___/|_|
//
// --------SHEET: GROUPS-ES--------------------------------------------------------------
// --------COLUMN: STATUS (A)------------------------------------------------------------
// --------------------------------------------------------------------------------------

function updateStatusCol() {
    // Get the list of Group IDs we use to index
    var groupIDlist = elasticGroupsSHEET.getRange(2, getColByNameFromSheet(elasticGroupsSHEET, "Group ID"), elasticGroupsSHEET.getLastRow() - 1).getValues(); // .getRange(row, col, numRows)

    // Cleaning up the ID list we use to index
    for (var counter = 0; counter < groupIDlist.length; counter++) {
        if (groupIDlist[counter][0] == "") {
            groupIDlist[counter][0] = 1; //group 1 will never be a real group we care about, so use it to make sure that we don't get off by one, we'll filter it out later
        }
    }

    // Ask for all events for all the groups we care about, in chunks of 200; Why 200, you ask? Because that's Meetup's API limit
    var offset = 0;
    var eventsForAllGroups = []
    do {
        var eventsForAllGroupsJSON = meetupAPIcall("/2/events", "group_id", groupIDlist, "status=past&offset=" + Math.floor(offset / 200));
        eventsForAllGroups = eventsForAllGroups.concat(eventsForAllGroupsJSON.results); //add a chunk of 200 to our array of results
        offset = offset + eventsForAllGroupsJSON.meta.count; //offset to get the next 200
        Utilities.sleep(1000); // to prevent MU API throttling
    } while (eventsForAllGroupsJSON.meta.total_count > offset); //keep going until we've fetched everything

    // Woo arrays...
    // https://webapps.stackexchange.com/questions/106503/how-do-i-write-data-to-a-single-range-in-google-apps-script
    var listStatusArray = [];

    //TODO: Check if set.getLastRow() is actually fast or if it sends a request to check every time
    for (var counter = 0; counter < elasticGroupsSHEET.getLastRow() - 1; counter++) {

        var currentGroupID = groupIDlist[counter];
        // Check if there is a Group ID (this will need to be manually entered for now...)
        if (currentGroupID == 1) { // we used 1 as a stand-in for no group id up above
            listStatusArray.push(["NO ID"]);
            continue; // If no Group ID, continue on.
        };

        var eventsForGroupJSON = eventsForAllGroups.filter(function(groupResult) { return groupResult.group.id == currentGroupID });
        //  var eventsForGroupJSON = meetupAPIcall("/2/events", "group_id", currentGroupID, "status=past");
        if (!eventsForGroupJSON) {
            listStatusArray.push(["MEETUP API FAILED"]); //requesting this group failed
            continue;
        }
        var currentGroupEvents = eventsForGroupJSON[0];
        var numMUs = eventsForGroupJSON.length;

        if (numMUs == 0) {
            listStatusArray.push(["NO EVENTS"]); // no MUs
            continue;
        }

        if (!("group" in currentGroupEvents)) {
            listStatusArray.push(["NO GROUP"]); // no "group"
            continue;
        }

        var dateDifference = Date.now() - currentGroupEvents.group.created;
        var months = Math.round(dateDifference / (1000 * 60 * 60 * 24 * 7 * 4.3452)); // not sure how to get more accurately
        var freqOfMU = numMUs / months;

        if (freqOfMU >= 0.3333) {
            // Green: meets at least once every 1 to 3 months
            listStatusArray.push(["Green"]);
        } else if (freqOfMU >= 0.1666 && freqOfMU < 0.3333) {
            // Yellow, meets at least once every 3 to 6 months
            listStatusArray.push(["Yellow"]);
        } else if (freqOfMU >= 0.0833 && freqOfMU < 0.1666) {
            // Orange, meets at least once every 6 to 12 months
            listStatusArray.push(["Orange"]);
        } else {
            // Red, has been over a year since last meetup
            listStatusArray.push(["Red"]);
        };

    }; // end of for-loop

    var statusRange = elasticGroupsSHEET.getRange(2, getColByNameFromSheet(elasticGroupsSHEET, "Status"), elasticGroupsSHEET.getLastRow() - 1, 1);
    statusRange.setValues(listStatusArray);
}

// --------------------------------------------------------------------------------------
//  _       _            _                          _               _ 
// | | __ _| |_ ___  ___| |_    _____   _____ _ __ | |_    ___ ___ | |
// | |/ _` | __/ _ \/ __| __|  / _ \ \ / / _ \ '_ \| __|  / __/ _ \| |
// | | (_| | ||  __/\__ \ |_  |  __/\ V /  __/ | | | |_  | (_| (_) | |
// |_|\__,_|\__\___||___/\__|  \___| \_/ \___|_| |_|\__|  \___\___/|_|
//
// --------SHEET: GROUPS-ES--------------------------------------------------------------
// --------COLUMN: Latest Event (C)------------------------------------------------------
// --------------------------------------------------------------------------------------

// TODO: pull meetupAPIcall out of loop, use comma separated list of group_ids instead (as in updateStatusCol)
function updateLatestMUEventCol() {
    // Get the list of Group IDs from the sheet
    var groupIDlist = elasticGroupsSHEET.getRange(2, getColByNameFromSheet(elasticGroupsSHEET, "Group ID"), elasticGroupsSHEET.getLastRow() - 1).getValues(); // .getRange(row, col, numRows)

    // Go through each Group ID
    var listLatestEventArray = [];
    for (var counter = 0; counter < elasticGroupsSHEET.getLastRow() - 1; counter++) {

        var currentGroupID = groupIDlist[counter];
        if (currentGroupID == "") {
            listLatestEventArray.push(["No Group ID"]);
            continue; // If no Group ID, continue on.
        };

        var newIDjson = meetupAPIcall("/2/groups", "group_id", currentGroupID, "fields=next_event%2Clast_event");
        Utilities.sleep(1000); // to prevent MU API throttling
        if (!newIDjson || newIDjson.meta.total_count == 0) {
            listLatestEventArray.push(["Meetup API call failed"]);
            continue; // Request failed, continue on.
        };
        var currentGroup = newIDjson.results[0];

        if ("next_event" in currentGroup && "time" in currentGroup.next_event) {
            var next_date = new Date(currentGroup.next_event.time);
            listLatestEventArray.push([next_date.toDateString()]);
        } else if ("last_event" in currentGroup && "time" in currentGroup.last_event) {
            var last_date = new Date(currentGroup.last_event.time);
            listLatestEventArray.push([last_date.toDateString()]);
        } else {
            listLatestEventArray.push(["NO EVENTS"]);
        };

    }; // end of for-loop

    // Now insert...listLatestEventArray...
    var statusRange = elasticGroupsSHEET.getRange(2, getColByNameFromSheet(elasticGroupsSHEET, "Latest Event"), elasticGroupsSHEET.getLastRow() - 1, 1);
    statusRange.setValues(listLatestEventArray);
}

// --------------------------------------------------------------------------------------
//                                                                       _ 
//   __ _ _ __ ___  _   _ _ __    _ __   __ _ _ __ ___   ___    ___ ___ | |
//  / _` | '__/ _ \| | | | '_ \  | '_ \ / _` | '_ ` _ \ / _ \  / __/ _ \| |
// | (_| | | | (_) | |_| | |_) | | | | | (_| | | | | | |  __/ | (_| (_) | |
//  \__, |_|  \___/ \__,_| .__/  |_| |_|\__,_|_| |_| |_|\___|  \___\___/|_|
//  |___/                |_| 


function updateGroupNameCol() {
    // Get the list of Group IDs we use to index
    var groupIDlist = elasticGroupsSHEET.getRange(2, getColByNameFromSheet(elasticGroupsSHEET, "Group ID"), elasticGroupsSHEET.getLastRow() - 1).getValues(); // .getRange(row, col, numRows)

    // Cleaning up the ID list we use to index
    for (var counter = 0; counter < groupIDlist.length; counter++) {
        if (groupIDlist[counter][0] == "") {
            groupIDlist[counter][0] = 1; //group 1 will never be a real group we care about, so use it to make sure that we don't get off by one, we'll filter it out later
        }
    }

    // Ask for all the groups we care about, in chunks of 200; Why 200, you ask? Because that's Meetup's API limit
    var offset = 0;
    var listOfAllGroups = []
    do {
        var allGroupsJSON = meetupAPIcall("/2/groups", "group_id", groupIDlist, "offset=" + Math.floor(offset / 200));
        Utilities.sleep(1000); // to prevent MU API throttling
        listOfAllGroups = listOfAllGroups.concat(allGroupsJSON.results); //add a chunk of 200 to our array of results
        offset = offset + allGroupsJSON.meta.count; //offset to get the next 200
    } while (allGroupsJSON.meta.total_count > offset); //keep going until we've fetched everything

    // Woo arrays...
    // https://webapps.stackexchange.com/questions/106503/how-do-i-write-data-to-a-single-range-in-google-apps-script
    var arrayForGroupNames = [];

    //TODO: Check if set.getLastRow() is actually fast or if it sends a request to check every time
    for (var counter = 0; counter < elasticGroupsSHEET.getLastRow() - 1; counter++) {

        var currentGroupID = groupIDlist[counter];
        // Check if there is a Group ID (this will need to be manually entered for now...)
        if (currentGroupID == 1) { // we used 1 as a stand-in for no group id up above
            arrayForGroupNames.push(["NO ID"]);
            continue; // If no Group ID, continue on.
        };

        var thingForGroupJSON = listOfAllGroups.filter(function(groupResult) { return groupResult.id == currentGroupID });
        //  var eventsForGroupJSON = meetupAPIcall("/2/events", "group_id", currentGroupID, "status=past");
        if (!thingForGroupJSON || thingForGroupJSON.length == 0) {
            arrayForGroupNames.push(["MEETUP API FAILED"]); //requesting this group failed
            continue;
        }

        // What to do here...?
        arrayForGroupNames.push([thingForGroupJSON[0].name]);



    }; // end of for-loop

    var statusRange = elasticGroupsSHEET.getRange(2, getColByNameFromSheet(elasticGroupsSHEET, "Group Name"), elasticGroupsSHEET.getLastRow() - 1, 1);
    statusRange.setValues(arrayForGroupNames);
}


// --------------------------------------------------------------------------------------
//                           _                               _ 
//  _ __ ___   ___ _ __ ___ | |__   ___ _ __ ___    ___ ___ | |
// | '_ ` _ \ / _ \ '_ ` _ \| '_ \ / _ \ '__/ __|  / __/ _ \| |
// | | | | | |  __/ | | | | | |_) |  __/ |  \__ \ | (_| (_) | |
// |_| |_| |_|\___|_| |_| |_|_.__/ \___|_|  |___/  \___\___/|_|
//
// Same as above except two spots; should pull out?

function updateMembersCol() {
    // Get the list of Group IDs we use to index
    var groupIDlist = elasticGroupsSHEET.getRange(2, getColByNameFromSheet(elasticGroupsSHEET, "Group ID"), elasticGroupsSHEET.getLastRow() - 1).getValues(); // .getRange(row, col, numRows)

    // Cleaning up the ID list we use to index
    for (var counter = 0; counter < groupIDlist.length; counter++) {
        if (groupIDlist[counter][0] == "") {
            groupIDlist[counter][0] = 1; //group 1 will never be a real group we care about, so use it to make sure that we don't get off by one, we'll filter it out later
        }
    }

    // Ask for all the groups we care about, in chunks of 200; Why 200, you ask? Because that's Meetup's API limit
    var offset = 0;
    var listOfAllGroups = []
    do {
        var allGroupsJSON = meetupAPIcall("/2/groups", "group_id", groupIDlist, "offset=" + Math.floor(offset / 200));
        Utilities.sleep(1000); // to prevent MU API throttling
        listOfAllGroups = listOfAllGroups.concat(allGroupsJSON.results); //add a chunk of 200 to our array of results
        offset = offset + allGroupsJSON.meta.count; //offset to get the next 200
    } while (allGroupsJSON.meta.total_count > offset); //keep going until we've fetched everything

    // Woo arrays...
    // https://webapps.stackexchange.com/questions/106503/how-do-i-write-data-to-a-single-range-in-google-apps-script
    var arrayForGroupNames = [];

    //TODO: Check if set.getLastRow() is actually fast or if it sends a request to check every time
    for (var counter = 0; counter < elasticGroupsSHEET.getLastRow() - 1; counter++) {

        var currentGroupID = groupIDlist[counter];
        // Check if there is a Group ID (this will need to be manually entered for now...)
        if (currentGroupID == 1) { // we used 1 as a stand-in for no group id up above
            arrayForGroupNames.push(["NO ID"]);
            continue; // If no Group ID, continue on.
        };

        var objectForGroupJSON = listOfAllGroups.filter(function(groupResult) { return groupResult.id == currentGroupID });
        //  var eventsForGroupJSON = meetupAPIcall("/2/events", "group_id", currentGroupID, "status=past");
        if (!objectForGroupJSON[0]) {
            arrayForGroupNames.push(["MEETUP API FAILED"]); //requesting this group failed
            continue;
        }

        // What to do here...?
        arrayForGroupNames.push([objectForGroupJSON[0].members]);

    }; // end of for-loop

    var statusRange = elasticGroupsSHEET.getRange(2, getColByNameFromSheet(elasticGroupsSHEET, "Members Total"), elasticGroupsSHEET.getLastRow() - 1, 1);
    statusRange.setValues(arrayForGroupNames);
}
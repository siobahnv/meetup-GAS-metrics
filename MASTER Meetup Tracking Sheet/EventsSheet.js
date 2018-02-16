// --------------------------------------------------------------------------------------
//                  _       _               _ _   _   _          
//  _   _ _ __   __| | __ _| |_ ___    __ _| | | | |_| |__   ___ 
// | | | | '_ \ / _` |/ _` | __/ _ \  / _` | | | | __| '_ \ / _ \
// | |_| | |_) | (_| | (_| | ||  __/ | (_| | | | | |_| | | |  __/
//  \__,_| .__/ \__,_|\__,_|\__\___|  \__,_|_|_|  \__|_| |_|\___|
//       |_|                                                     
//                       _       
//   _____   _____ _ __ | |_ ___ 
//  / _ \ \ / / _ \ '_ \| __/ __|
// |  __/\ V /  __/ | | | |_\__ \
//  \___| \_/ \___|_| |_|\__|___/
//

function updateEvents() {
    // Get the list of Group IDs we use to index
    var eventIDlist = elasticEventsSHEET.getRange(2, getColByNameFromSheet(elasticEventsSHEET, "Event ID"), elasticEventsSHEET.getLastRow() - 1).getValues(); // .getRange(row, col, numRows)

    // Cleaning up the ID list we use to index
    for (var counter = 0; counter < eventIDlist.length; counter++) {
        if (eventIDlist[counter][0] == "") {
            eventIDlist[counter][0] = 1; //group 1 will never be a real group we care about, so use it to make sure that we don't get off by one, we'll filter it out later
        }
    }

    // Want to call batches of 50 from GAS
    var offset = 0;
    var totalCount = elasticEventsSHEET.getLastRow() - 1;
    var set = 50;
    var counter = 0;
    
    // Don't need to update ALL rows, some are too old and most likely broken
    // var counterCap = offset + set;
    var counterCap = 200;
  
    do {

        // https://webapps.stackexchange.com/questions/106503/how-do-i-write-data-to-a-single-range-in-google-apps-script
        // This need to be tossed each 200 loop so inside the do-while they go
        var arrayGroupName = [];
        var arrayEventTitle = [];
        var arrayDate = [];
        var arrayTime = [];
        var arrayLastUpdated = [];

        for (counter; counter < counterCap; counter++) {
            var currentEventID = eventIDlist[counter][0];

            if (currentEventID == 1) { // we used 1 as a stand-in for no group id up above
                arrayGroupName.push(["NO ID"]);
                arrayEventTitle.push(["NO ID"]);
                arrayDate.push(["NO ID"]);
                arrayTime.push(["NO ID"]);
                arrayLastUpdated.push([new Date]);
                continue; // If no ID, continue on.
            };

            var eventJSON = meetupAPIcall("/2/events", "event_id", currentEventID); // /2/events won't take a comma seperated list
            Utilities.sleep(300); // to prevent MU API throttling

            if (!eventJSON || eventJSON.results.length == 0) {
                arrayGroupName.push(["MEETUP API FAILED"]); //requesting this group failed
                arrayEventTitle.push(["MEETUP API FAILED"]);
                arrayDate.push(["MEETUP API FAILED"]);
                arrayTime.push(["MEETUP API FAILED"]);
                arrayLastUpdated.push([new Date]);
                continue;
            }

            var currentEvent = eventJSON.results[0];
            arrayGroupName.push([currentEvent.group.name]);
            arrayEventTitle.push([currentEvent.name]);

            if (currentEvent.time) {
                var eventDateAndTime = new Date(currentEvent.time);
                var eventDate = eventDateAndTime.toLocaleDateString();
                var eventTime = eventDateAndTime.toLocaleTimeString();
            } else {
                var eventDate = "";
                var eventTime = "";
            };

            arrayDate.push([eventDate]);
            arrayTime.push([eventTime]);
            arrayLastUpdated.push([new Date]);

        };

        var rangeGroupName = elasticEventsSHEET.getRange(offset + 2, getColByNameFromSheet(elasticEventsSHEET, "Group Name"), set, 1);
        rangeGroupName.setValues(arrayGroupName);

        var rangeEventTitle = elasticEventsSHEET.getRange(offset + 2, getColByNameFromSheet(elasticEventsSHEET, "Event Title"), set, 1);
        rangeEventTitle.setValues(arrayEventTitle);

        var rangeDate = elasticEventsSHEET.getRange(offset + 2, getColByNameFromSheet(elasticEventsSHEET, "Date"), set, 1);
        rangeDate.setValues(arrayDate);

        var rangeTime = elasticEventsSHEET.getRange(offset + 2, getColByNameFromSheet(elasticEventsSHEET, "Time"), set, 1);
        rangeTime.setValues(arrayTime);

        var rangeTime = elasticEventsSHEET.getRange(offset + 2, getColByNameFromSheet(elasticEventsSHEET, "Last Updated"), set, 1);
        rangeTime.setValues(arrayLastUpdated);

        offset = counter;

    } while (offset < totalCount);
}
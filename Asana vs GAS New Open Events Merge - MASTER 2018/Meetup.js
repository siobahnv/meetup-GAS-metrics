// TODO: add if meta.total_count != 0 checks as well as what to do if not

// --------------------------------------------------------------------------------------
// --------ENTIRE DOC----Asking MU for Data----------------------------------------------
// --------------------------------------------------------------------------------------

function meetupAPIcall(methodCall, parameters, currentIndex, fields) {
    var url = "https://api.meetup.com" + methodCall + "?" + parameters + "=" + currentIndex + (fields ? "&" + fields : "") + "&sign=true&key=" + MEETUP_KEY;
    
    var result = UrlFetchApp.fetch(url, { "muteHttpExceptions" : true }); 
    
    if (result) {
        var resultText = result.getContentText()
        if (resultText != "") {
          return JSON.parse(resultText);
        } else {
          return resultText;
        }
    } else {
        return null;
    }
}

function meetupAPIcallNOINDEX(methodCall, parameters, fields) {
    var url = "https://api.meetup.com" + methodCall + "?" + parameters + (fields ? "&" + fields : "") + "&sign=true&key=" + MEETUP_KEY;
    var result = UrlFetchApp.fetch(url, { "muteHttpExceptions" : true }); 
    if (result) {
        var resultText = result.getContentText()
        return JSON.parse(resultText);
    } else {
        return null;
    };
}

// --------------------------------------------------------------------------------------
// --------Setup & Events Requests-------------------------------------------------------
// --------------------------------------------------------------------------------------

function pullNewMUeventsByKeyword(keyword) {

    // TIME TO PAGINATE API calls!
    // offset & page: https://www.meetup.com/meetup_api/#making_request
    // via https://stackoverflow.com/questions/35121504/get-more-than-200-group-members-from-the-meetup-api
    var offset = 0;
    var totalPageCount = 0;
    var pages = 50;

    var listOfNewEventsJSON = meetupAPIcallNOINDEX("/2/open_events", "and_text=True&text=" + keyword, "status=upcoming&offset=" + offset + "&page=" + pages + "&limited_events=False");
    var listResults = listOfNewEventsJSON.results; // [ {}, {}, {} ]
    var totalPageCount = listOfNewEventsJSON.meta.total_count;
    offset++;
    Utilities.sleep(500); // to prevent MU API throttling

    var offsetCount = totalPageCount / pages;
    for (offset; offset <= offsetCount; offset++) {
        var listOfNewEventsJSON = meetupAPIcallNOINDEX("/2/open_events", "and_text=False&text=" + keyword, "status=upcoming&offset=" + offset + "&page=" + pages + "&limited_events=False");
        var newListResults = listOfNewEventsJSON.results;
        listResults = listResults.concat(newListResults);
        Utilities.sleep(500); // to prevent MU API throttling
    };

    // TIME TO FILTER
    var filteredListResults = listResults.filter(function(event) {
        var cleanedUpDescription = event.description != undefined ? event.description : "No Description"; // fixing description undefined
        cleanedUpDescription = cleanedUpDescription.toLowerCase(); // fixing case sensitivity
        return cleanedUpDescription.indexOf(keyword) != -1;;
    });

    // Pass it along and go through our Data
    filteredListResults.forEach(function(result) {
        addToGoogleSheet(result, keyword);
        addToAsana(result, keyword);
    });
};

function pullMUeventsByMemberID(memberIDs) {

    // Paginating may be overkill here, but why not?
    // For more info: http://www.meetup.com/meetup_api/docs/2/events/
    // Single member id, to find events in this member's groups (hence looping through array above)
    var offset = 0;
    var totalPageCount = 0;
    var pages = 50;

    var eventsJSON = meetupAPIcall("/2/events", "member_id", memberIDs, "status=upcoming&offset=" + offset + "&page=" + pages);
    var listResults = eventsJSON.results; // [ {}, {}, {} ]
    var totalPageCount = eventsJSON.meta.total_count;
    offset++;
    Utilities.sleep(500); // to prevent MU API throttling

    var offsetCount = totalPageCount / pages;
    for (offset; offset <= offsetCount; offset++) {
        var listOfNewEventsJSON = meetupAPIcall("/2/events", "member_id", memberIDs, "status=upcoming&offset=" + offset + "&page=" + pages);
        var newListResults = listOfNewEventsJSON.results;
        listResults = listResults.concat(newListResults);
        Utilities.sleep(500); // to prevent MU API throttling
    };

    // And pass it along
    listResults.forEach(function(result) {
        addToGoogleSheet(result, "none");
        addToAsana(result, "elastic stack"); // it's a "general" as I can think to choose
    });
}




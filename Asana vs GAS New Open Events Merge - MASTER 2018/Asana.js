// --------------------------------------------------------------------------------------
// --------ASANA-------------------------------------------------------------------------
// --------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------
// Asana API calls
// --------------------------------------------------------------------------------------
// This works for Personal Access Token, not OAuth2

function asanaHTTPSconnection(url, options) {
    var result = UrlFetchApp.fetch(url, options)
    var resultText = result.getContentText()
    if (!resultText) {
        return null;
    }
    return JSON.parse(resultText);
}

function asanaPaginate(results, options) {
    var data = results.data;
    var nextpage = results.next_page;

    while (nextpage) {
        var url = nextpage.uri;
        var moreData = asanaHTTPSconnection(url, options);
        data = data.concat(moreData.data);
        nextpage = moreData.next_page;
    }

    return data;
}

// --------------------------------------------------------------------------------------
// Creating a new Task in Asana
// --------------------------------------------------------------------------------------

function createEventTask(eventName, eventURL, eventID, eventDate, eventNotes, eventRSVPs, region, keyword) {
    var body = {
        "data": {
            "name": eventName,
            "assignee": assignee,
            "projects": [project_id_events],
            "due_at": eventDate,
            "notes": eventNotes,
            "memberships": [{
                "project": project_id_events,
                "section": section_id_pending_validation
            }],
            "custom_fields": {
                // Source: https://stackoverflow.com/questions/41257621/updating-a-custom-field-using-asana-python-api
                "440204579700571": eventURL,
                "443557655952885": eventRSVPs,
                "463246496171133": eventID // me new hack
                    //"440204579700573": "MU" + eventID // me old hack
            },
            // Source: https://community.asana.com/t/developer-question-on-creating-tasks-with-tags/5109/5
            "tags": [tags_meetup, region, keyword],
            "external": { "id": eventID, "data": 'This is the two-ltr identifier + the event ID.' }
        }
    };
    var data = JSON.stringify(body);

    var options = {
        "method": "POST",
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + personal_access_token
        },
        "payload": data
    };

    var url = "https://app.asana.com/api/1.0/tasks";
    return asanaHTTPSconnection(url, options);

}

// --------------------------------------------------------------------------------------
// Function that is called to POST Subtasks, which are just tasks
// --------------------------------------------------------------------------------------

function createSubtasks(task_id, subtask) {
    var body = {
        "data": {
            "name": subtask,
        }
    };
    var data = JSON.stringify(body);

    var options = {
        "method": "POST",
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + personal_access_token
        },
        "payload": data
    };

    var url = "https://app.asana.com/api/1.0/tasks/" + task_id + "/subtasks";
    var results = asanaHTTPSconnection(url, options);
}

// --------------------------------------------------------------------------------------
// Creating a new Task in Asana
// --------------------------------------------------------------------------------------

function createGroupTask(groupName, groupURL, groupID, groupFound, groupNotes, groupMembership) {
    var body = {
        "data": {
            "name": groupName,
            "assignee": assignee,
            "projects": [project_id_user_groups],
            "notes": groupNotes,
            "memberships": [{
                "project": project_id_user_groups,
                "section": section_id_pending_validation_groups
            }],
            "custom_fields": { // Source: https://stackoverflow.com/questions/41257621/updating-a-custom-field-using-asana-python-api 
                "463246496171133": groupID // me new hack               
            },
            // Source: https://community.asana.com/t/developer-question-on-creating-tasks-with-tags/5109/5
            "tags": [tags_meetup],
            "external": { "id": groupID, "data": 'This is the two-ltr identifier + the group ID.' }
        }
    };

    if (groupURL) {
        body.data.custom_fields["440204579700571"] = groupURL;
    }

    if (groupFound) {
        body.data.custom_fields["444704848456621"] = groupFound;
    }

    if (groupMembership) {
        body.data.custom_fields["444704848456623"] = groupMembership;
    }

    var data = JSON.stringify(body);

    var options = {
        "method": "POST",
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + personal_access_token
        },
        "payload": data
    };

    var url = "https://app.asana.com/api/1.0/tasks";
    return asanaHTTPSconnection(url, options);

}

// --------------------------------------------------------------------------------------
// Get list of Meetup Event IDs 
// from External[].ID
// in Project: "Events" for all Tasks in Asana
// --------------------------------------------------------------------------------------

function getMUeventIDsFromExternalID() {

    var options = {
        "method": "GET",
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + personal_access_token
        }
    };

    // GET    /projects/projectId-id/tasks
    // Returns the compact task records for all tasks within the given project, ordered by their priority within the project.
    var url = "https://app.asana.com/api/1.0/projects/420524365418591/tasks?opt_fields=id,name,custom_fields,external.id,external.data&limit=100&opt_pretty";
    var results = asanaHTTPSconnection(url, options);

    // data = [ {}, {}, {}]
    // {} = custom_fields, name, id
    // var dataArray = results.data;
    // NEW, to test...
    var dataArray = asanaPaginate(results, options);
    var arrayListOfMUidsInAsana = [];

    for (var count = 0; count < dataArray.length; count++) {
        if (dataArray[count].external) {
            var meetUpEventID = dataArray[count].external.id;
            arrayListOfMUidsInAsana.push(meetUpEventID);
        }
    }

    Logger.log("External IDs list");
    Logger.log(arrayListOfMUidsInAsana);
    return arrayListOfMUidsInAsana;
}

function getMUeventIDsFromCustomFields() {

    var options = {
        "method": "GET",
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + personal_access_token
        }
    };

    // GET    /projects/projectId-id/tasks
    // Returns the compact task records for all tasks within the given project, ordered by their priority within the project.
    // var url = "https://app.asana.com/api/1.0/projects/420524365418591/tasks?opt_fields=id,name,custom_fields,external.id,external.data&limit=100&opt_pretty";
    var url = "https://app.asana.com/api/1.0/projects/420524365418591/tasks?opt_fields=id,name,custom_fields&limit=100&opt_pretty";
  
  // Is the limit a problem? ^^^
  
    var results = asanaHTTPSconnection(url, options);

    // data = [ {}, {}, {}]
    // {} = custom_fields, name, id
    // var dataArray = results.data;
    // NEW, to test...
    var dataArray = asanaPaginate(results, options);
  
    var arrayListOfMUidsInAsana = [];

    for (var count = 0; count < dataArray.length; count++) {
        if (dataArray[count].custom_fields) {
            // var meetUpEventID = dataArray[count].external.id;

            // time to find that bugger...
            var arrayCustomFields = dataArray[count].custom_fields;
            var currentCustomIndex = arrayCustomFields.filter(function(field) {
                return field.id == 463246496171133;
            })
            var meetUpEventID = currentCustomIndex[0].text_value;

            arrayListOfMUidsInAsana.push(meetUpEventID);
        }
    }

    Logger.log("Custom Field Index IDs list");
    Logger.log(arrayListOfMUidsInAsana);
    return arrayListOfMUidsInAsana;
}


// --------------------------------------------------------------------------------------
// Get list of Meetup Group IDs 
// from External[].ID
// in Project: "User Groups" for all Tasks in Asana
// --------------------------------------------------------------------------------------

function getMUgroupIDsFromExternalID() {

    var options = {
        "method": "GET",
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + personal_access_token
        }
    };

    // GET    /projects/projectId-id/tasks
    // Returns the compact task records for all tasks within the given project, ordered by their priority within the project.
    var url = "https://app.asana.com/api/1.0/projects/420524365418595/tasks?opt_fields=id,name,custom_fields,external.id,external.data&limit=" + LIMIT + "&opt_pretty";
    var results = asanaHTTPSconnection(url, options);
    // NEW, to test...
    var dataArray = asanaPaginate(results, options);

    // data = [ {}, {}, {}]
    // {} = custom_fields, name, id
    // var dataArray = results.data;
    var arrayListOfMUidsInAsana = [];

    for (var count = 0; count < dataArray.length; count++) {
        if (dataArray[count].external) {
            var meetUpEventID = dataArray[count].external.id;
            arrayListOfMUidsInAsana.push(meetUpEventID);
        }
    }

    Logger.log(arrayListOfMUidsInAsana);
    return arrayListOfMUidsInAsana;
}

function getMUgroupIDsFromCustomFields() {

    var options = {
        "method": "GET",
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + personal_access_token
        }
    };

    // GET    /projects/projectId-id/tasks
    // Returns the compact task records for all tasks within the given project, ordered by their priority within the project.
    var url = "https://app.asana.com/api/1.0/projects/420524365418595/tasks?opt_fields=id,name,custom_fields,external.id,external.data&limit=" + LIMIT + "&opt_pretty";
    var results = asanaHTTPSconnection(url, options);
    // NEW, to test...
    var dataArray = asanaPaginate(results, options);

    // data = [ {}, {}, {}]
    // {} = custom_fields, name, id
    // var dataArray = results.data;
    var arrayListOfMUidsInAsana = [];

    for (var count = 0; count < dataArray.length; count++) {
        if (dataArray[count].custom_fields) {
            // var meetUpEventID = dataArray[count].external.id;

            // time to find that bugger...
            var arrayCustomFields = dataArray[count].custom_fields;
            var currentCustomIndex = arrayCustomFields.filter(function(field) {
                return field.id == 463246496171133;
            })
            var meetUpEventID = currentCustomIndex[0].text_value;

            arrayListOfMUidsInAsana.push(meetUpEventID);
        }
    }

    Logger.log(arrayListOfMUidsInAsana);
    return arrayListOfMUidsInAsana;
}
//--------------------------------------------------------------------------------------
// Get all tasks from Events, show id/external/name/memberships
// mostly for testing
//--------------------------------------------------------------------------------------

function getTasks() {
    var options = {
        "method": "GET",
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + personal_access_token
        }
    };

    // GET    /projects/projectId-id/tasks
    // Returns the compact task records for all tasks within the given project, ordered by their priority within the project.
    var url = "https://app.asana.com/api/1.0/projects/420524365418591/tasks?opt_expand=external.id,external.data,id,name,memberships&limit=" + LIMIT;
    var results = asanaHTTPSconnection(url, options);
    // Logger.log(JSON.stringify(results));
    // NEW, to test...
    var dataResults = asanaPaginate(results, options);
    Logger.log(JSON.stringify(dataResults));
}

// --------------------------------------------------------------------------------------
// --------Add to Asana------------------------------------------------------------------
// --------------------------------------------------------------------------------------

function addToAsana(currentEventEntry, keyword) {

    // Checking event against the list
    // var currentMUeventIDsList = getMUeventIDs(); // What is this again? [ "", "", "" ]?
  var list1 = getMUeventIDsFromCustomFields();
  Logger.log("list1");
  Logger.log(list1);
  var list2 = getMUeventIDsFromExternalID();
  Logger.log("list2");
  Logger.log(list2);
    // var currentMUeventIDsList = getMUeventIDsFromCustomFields().concat(getMUeventIDsFromExternalID());
  
  // TODO: A third list? maybe chelk by URL?
  
  var currentMUeventIDsList  = list1.concat(list2);

    if (currentEventEntry && currentEventEntry.id) {
        var eventID = "MU" + currentEventEntry.id;
    } else {
        throw "No event ID, shouldn't be possible";
    }
  
  // Betting on this not working...
    if (currentMUeventIDsList.indexOf(eventID) != -1) {
        return;
    }
  
  // Trying more manual search; this doesn't seem to matter either...
  /*for (var check = 0; check < currentMUeventIDsList.length; check++) {
    if (eventID == currentMUeventIDsList[check][0]) { // TODO: Check that this is checking correctly
            return;
        };
    };*/

    // Prepping Event Entry
    // -------------------------------------------------------------------------------
    var keyword = keyword_tags[keyword];

    // Setting Defaults
    var currentEventEntryDateJSON = JSON.stringify(new Date());
    var currentEventEntryDateHuman = "";
    var eventNotes = "";
    var venueRegion = "Region:Unknown";

    var eventName = "[MU] " + currentEventEntry.name;
    var eventURL = currentEventEntry.event_url;
    var eventRSVPs = currentEventEntry.waitlist_count + currentEventEntry.maybe_rsvp_count + currentEventEntry.yes_rsvp_count;

    if (currentEventEntry.time) {
        var eventDate = new Date(currentEventEntry.time); //milliseconds
        var currentEventEntryDateJSON = JSON.stringify(eventDate);
        var currentEventEntryDateHuman = eventDate.toLocaleDateString();
    }

    if (currentEventEntry.venue) {
        var notes_line0 = eventURL + "\n";
        var notes_line1 = currentEventEntry.group.name + "\n";
        var notes_line2 = currentEventEntry.venue.name + "\n";
        var notes_line3 = currentEventEntry.venue.address_1 + "\n";
        var notes_line4 = currentEventEntry.venue.city + ", " + currentEventEntry.venue.country;
        eventNotes = notes_line0 + notes_line1 + notes_line2 + notes_line3 + notes_line4;

        // Region stuff / careful on merge later
        if (currentEventEntry.venue.country) {
            var venueCountry = currentEventEntry.venue.country
            venueRegion = regionDICT[venueCountry.toLowerCase()];

            eventName = "[MU] " + venueCountry.toUpperCase() + ", " + currentEventEntry.venue.city + ": " + currentEventEntry.name;
        }
    }

    var venueRegionTag = region_tags[venueRegion];

    // If it's not already in the list, Create Event Task
    // --------------------------------------------------------------------------------
    var newTask = createEventTask(eventName, eventURL, eventID, currentEventEntryDateJSON, eventNotes, eventRSVPs, venueRegionTag, keyword);

    // Subtasks
    var newTaskID = newTask.data.id;
    createSubtasks(newTaskID, "Follow-up");
    createSubtasks(newTaskID, "Promo Email");
    createSubtasks(newTaskID, "Announcement");
    createSubtasks(newTaskID, "Swag");
    createSubtasks(newTaskID, "Food & Beverage");
    createSubtasks(newTaskID, "Venue: ");
    createSubtasks(newTaskID, "Bio/Abstract");
    createSubtasks(newTaskID, "Speaker(s): ");
    createSubtasks(newTaskID, "Date: " + currentEventEntryDateHuman);

    // --------------------------------------------------------------------------------------
    // Checking Group of Fake Object against the List
    // --------------------------------------------------------------------------------------
    // var currentMUgroupIDsList = getMUgroupIDs();
    // getMUgroupIDsFromCustomFields
    var currentMUgroupIDsList = getMUgroupIDsFromCustomFields().concat(getMUgroupIDsFromExternalID());

    if (currentEventEntry.group && currentEventEntry.group.id) {
        var groupID = "MU" + currentEventEntry.group.id;
    } else {
        throw "No group ID! Shouldn't happen";
    }

    if (currentMUgroupIDsList.indexOf(groupID) != -1) {
        return; //duplicate, don't need it
    }

    // Prepping Group Info of Event Entry
    // --------------------------------------------------------------------------------------

    // Setting Defaults
    var groupURL = ""; // Need to get from MU API call; probably already done so in other code file    
    var groupID = "";
    var groupFound = "";
    var groupMembership = "";

    var groupName = "[UG] " + currentEventEntry.group.name;

    if (currentEventEntry.group.created) {
        groupFound = new Date(currentEventEntry.group.created).toLocaleDateString(); //currentEventEntry.group.created is number of milliseconds
    }

    if (currentEventEntry.venue) {
        var notes_line1 = currentEventEntry.venue.city + ", " + currentEventEntry.venue.country;
        groupName = "[UG] " + currentEventEntry.venue.country.toUpperCase() + ", " + currentEventEntry.venue.city + ": " + currentEventEntry.group.name;
    } else {
        var notes_line1 = "";
    };

    var notes_line2 = "Email Alias:" + "\n";
    var notes_line3 = "Organizers: " + "\n";
    var groupNotes = notes_line1 + notes_line2 + notes_line3;

    // Create Group Task
    // --------------------------------------------------------------------------------------
    createGroupTask(groupName, groupURL, groupID, groupFound, groupNotes, groupMembership);

}

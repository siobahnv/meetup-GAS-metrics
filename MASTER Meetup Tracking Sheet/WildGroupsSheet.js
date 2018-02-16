// --------------------------------------------------------------------------------------
// -------IN PROGRESS------------------URG BLEH CRAP...----------------------------------
// --------------------------------------------------------------------------------------
// --------SHEETS: GROUPS----------------------------------------------------------------
// --------COLUMNS: ID, GROUP URL NAME---------------------------------------------------
// --------------------------------------------------------------------------------------
/*
function pullGroupIDs() {
  // *** Working out the details of getting Group IDs from Group URLs and inserting in sheet ***
  // Confirmed: works with Regex expressions <----- Probably meant to do this in the sheet? copy/pasta?
  
  // Lazy and still learning, just use *comment-lines* to toggle between the two sheets :P
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Groups-ES");
  // var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Groups-Related");
  
  // Get Group URL List
  var groupURLlist = sheet.getRange(2, 3, sheet.getLastRow() -1).getValues();
  
  for (var counter = 0; counter < sheet.getLastRow() - 1; counter++) {
    // Get Group URL for Meetup method call
    var currentGroupURL = groupURLlist[counter];
    
    // Meetup Stuff
    var host = "https://api.meetup.com/";
    var methodCall = "/2/groups";
    var parameters = "?group_urlname=";
    var sign = "&sign=true";
    var url = host + methodCall + parameters + currentGroupURL + sign + meetupPersonalKEY;
    var json = UrlFetchApp.fetch(url).getContentText();
    var newIDjson = JSON.parse(json);
    
    // Put in sheet if exists
    if (newIDjson.results.length != 0) {
      var newID = newIDjson.results[0].id;
      
      var cell = sheet.getRange(counter + 2, 2);
      cell.setValue(newID);
    };
  }; // end of for-loop
}
*/

// --------------------------------------------------------------------------------------
// --------SHEET: GROUPS-Related---------------------------------------------------------
// --------COLUMNS: GROUP NAME, URL NAME, URL, CITY, STATE,------------------------------
// -----------------COUNTRY, LAT, LONG, DATE, MEM TOTAL----------------------------------
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------
// Currently overwrites all defined/automated fields (i.e. groupName, URL, City/State/Country, etc.)
// TODO: Generalized to Group Sheets? (ES-Ggroups & Groups-Related)
// TODO: Deal with it timing out... data set too large? use last updated?

function fillDataFromGroupIDs() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Groups-Related");
  var groupIDlist = sheet.getRange(2, getColByNameAndSheet("Group ID", "Groups-Related"), sheet.getLastRow() -1).getValues();
  
  for (var counter = 0; counter < sheet.getLastRow() - 1; counter++) {
    
    var currentGroupID = groupIDlist[counter];
    if (currentGroupID == "") {
      continue; // If no Group ID, continue on.
    };
    
    var JSON = meetupAPIcall("/2/groups", "group_id", currentGroupID, "");
    var currentGroup = JSON.results[0];
    
    // Put in sheet if exists (should have a Result of 1 for every ID; unless group died)
    // Shouldn't do anything if group no longer exists, example (Group ID): 11103212
    // TODO: Maybe add in a way to mark DEAD groups
    if (JSON.results.length != 0) { 
      
      // Add Status/Health
      
      // Add "Latest Event"
      
      var groupName = currentGroup.name;
      var cell = sheet.getRange(counter + 2, getColByNameAndSheet("Group", "Groups-Related"));
      cell.setValue(groupName);
      
      // already have ID
      
      var groupURLname = currentGroup.urlname;
      var cell = sheet.getRange(counter + 2, getColByNameAndSheet("Group URLname", "Groups-Related"));
      cell.setValue(groupURLname);
      
      var groupURL = currentGroup.link;
      var cell = sheet.getRange(counter + 2, getColByNameAndSheet("Group URL", "Groups-Related"));
      cell.setValue(groupURL);
      
      // TODO: figure out how to get just the "names" of *all* organizers
      /*var groupOrganizers = newIDjson.results[0].organizer;
      var cell = sheet.getRange(counter + 2, 7);
      cell.setValue(groupOrganizers);*/
      
      var groupCity = currentGroup.city;
      var cell = sheet.getRange(counter + 2, getColByNameAndSheet("City", "Groups-Related"));
      cell.setValue(groupCity);
      
      var groupState = currentGroup.state;
      if (groupState) {
        var cell = sheet.getRange(counter + 2, getColByNameAndSheet("State", "Groups-Related"));
        cell.setValue(groupState);
      }
      
      var groupCountry = currentGroup.country;
      var cell = sheet.getRange(counter + 2, getColByNameAndSheet("Country", "Groups-Related"));
      cell.setValue(groupCountry);
      
      // TODO: Region
      
      var groupLat = currentGroup.lat;
      var cell = sheet.getRange(counter + 2, getColByNameAndSheet("Lat", "Groups-Related"));
      cell.setValue(groupLat);
      
      var groupLong = currentGroup.lon;
      var cell = sheet.getRange(counter + 2, getColByNameAndSheet("Long", "Groups-Related"));
      cell.setValue(groupLong);
      
      var groupFoundedDate = currentGroup.created;
      var date = new Date(groupFoundedDate);
      var cell = sheet.getRange(counter + 2, getColByNameAndSheet("Founded", "Groups-Related"));
      cell.setValue(date);
      
      var groupMembersTotal = currentGroup.members;
      var cell = sheet.getRange(counter + 2, getColByNameAndSheet("Members Total", "Groups-Related"));
      cell.setValue(groupMembersTotal);
    };
  }; // end of for-loop
}


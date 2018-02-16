// --------------------------------------------------------------------------------------
// ---------Check for new groups & add to list-------------------------------------------
// --------------------------------------------------------------------------------------

function checkForNewMemberGroups() {
  
  // DUPLICATION AVOIDATION - Get our columns to check against
  // Also needs a SAMPLE ROW so "Range" / array isn't empty
  var masterIDsList = MAIN_SHEET.getSheetValues(2, getColByNameFromSheet(MAIN_SHEET, "Group ID"), MAIN_SHEET.getLastRow() - 1, 1);
  var masterGroupNamesList = MAIN_SHEET.getSheetValues(2, getColByNameFromSheet(MAIN_SHEET, "Group Name"), MAIN_SHEET.getLastRow() - 1, 1);
  var currentIDsList = MEMBERS_SHEET.getSheetValues(2, getColByNameFromSheet(MEMBERS_SHEET, "Group ID"), MEMBERS_SHEET.getLastRow() - 1, 1);
  
  // Want to check masterIDsList AGAINST currentIDsList? masterIDsList >= currentIDsList
  for (var counter = 0; counter < masterIDsList.length; counter++) {
    var currentEventEntry = masterIDsList[counter];
    var currentEventGroupName = masterGroupNamesList[counter];
    
    // CHECK FOR DUPS
    var sum = 0;
    for (var check = 0; check < currentIDsList.length; check++) {
      if (currentEventEntry[0] == currentIDsList[check][0]) { // compare strings, because arrays doesn't work...
        sum++;
      };
    };
    
    // IF IT PASSES, ie. currentEventEntry is not in currentIDsList, append to sheet
    if (sum == 0) {      
      // APPEND DATA - almost there...are we there yet?
      // Sheet Headers: Group ID,	Group Name,	Month Etc...																			
      MEMBERS_SHEET.appendRow([currentEventEntry[0], currentEventGroupName[0]]);  
    } 
  } // end of for loop
} // end of function


// --------------------------------------------------------------------------------------
// ------Get each group's membership numbers---------------------------------------------
// --------------------------------------------------------------------------------------

function pullMembershipsNumbers() {  
  // prep Column/Range
  var memTotalValuesArray = [];
  var today = new Date();
  memTotalValuesArray.push([today]);
  
  // Now for Meetup API calls...
  var currentIDsList = MEMBERS_SHEET.getSheetValues(2, getColByNameFromSheet(MEMBERS_SHEET, "Group ID"), MEMBERS_SHEET.getLastRow() - 1, 1);
  for (var counter = 0; counter < currentIDsList.length; counter++) {
    var results = meetupAPIcall("/2/groups", "group_id", currentIDsList[counter]);
    Utilities.sleep(1000); // to prevent MU API throttling
    
    if (results && results.meta && results.meta.total_count != 0) {
      // Meetup API didn't hiccup and actually has data 
      var resultToStore = results.results[0].members;
      memTotalValuesArray.push([resultToStore.toString()]);
    } else {
      // There's no data, push an empty "value"
      memTotalValuesArray.push([""]);
    }
    
  }
  
  // Then to add it to the sheet! ie. add to new column (ie range)
  var lastColumn = MEMBERS_SHEET.getLastColumn();
  var lastRow = MEMBERS_SHEET.getLastRow();
  var columnToAdd = MEMBERS_SHEET.getRange(1, lastColumn + 1, lastRow);
  columnToAdd.setValues(memTotalValuesArray);
}

// --------------------------------------------------------------------------------------
// ------------------MAIN---------------------------------------------------------------
// --------------------------------------------------------------------------------------

function UPDATEmemOverTimeSheet() {
  checkForNewMemberGroups();
  pullMembershipsNumbers();
}

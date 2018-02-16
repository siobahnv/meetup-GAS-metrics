// This can be tested as a Standalone script, but due to the Custom Menu / Triggers
// this needs to be "bound" to the sheet.
// --------------------------------------------------------------------------------------
// --------TODOs-------------------------------------------------------------------------

// Check scripts for existing tabs: update Health/Status, Group_Name, Membership Numbers, Organizers
// Create two functions: fillALLdata vs fillESSENTIALdata?
// Groups-ES & Groups Related via Events: auto-add groups, sort to which sheet, check for duplicates
// Create & code a Region auto-fill script

// Currently some time out issues...maybe need to use the "Last Updated" col in script?

// --------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------
//             _   _                _            
//   ___ _ __ | |_(_)_ __ ___    __| | ___   ___ 
//  / _ \ '_ \| __| | '__/ _ \  / _` |/ _ \ / __|
// |  __/ | | | |_| | | |  __/ | (_| | (_) | (__ 
//  \___|_| |_|\__|_|_|  \___|  \__,_|\___/ \___|


// --------------------------------------------------------------------------------------
// --------ENTIRE DOC----Get sheet(s)----------------------------------------------------
// --------------------------------------------------------------------------------------

function getSheetFromMasterSpreadsheet(sheetName) {
    var sheet = SpreadsheetApp.openByUrl(masterSHEETurl).getSheetByName(sheetName);
    return sheet;
}

// --------------------------------------------------------------------------------------
// --------ENTIRE DOC----Asking MU for Data----------------------------------------------
// --------------------------------------------------------------------------------------

function meetupAPIcall(methodCall, parameters, currentIndex, fields) {
    var url = "https://api.meetup.com" + methodCall + "?" + parameters + "=" + currentIndex + (fields ? "&" + fields : "") + "&sign=true&key=" + meetupPersonalKEY;
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
    var url = "https://api.meetup.com" + methodCall + "?" + parameters + (fields ? "&" + fields : "") + "&sign=true&key=" + meetupPersonalKEY;
    var result = UrlFetchApp.fetch(url)
    if (result) {
        var resultText = result.getContentText()
        return JSON.parse(resultText);
    } else {
        return null;
    };
}

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
//  _        _                           
// | |_ _ __(_) __ _  __ _  ___ _ __ ___ 
// | __| '__| |/ _` |/ _` |/ _ \ '__/ __|
// | |_| |  | | (_| | (_| |  __/ |  \__ \
//  \__|_|  |_|\__, |\__, |\___|_|  |___/
//             |___/ |___/         
//
// --------------------------------------------------------------------------------------
// --------Add MENU to SPREADSHEET------------------------------------------------------
// --------------------------------------------------------------------------------------

// "Simple" Trigger

// See: https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet#addMenu(String,Object)
// The onOpen function is executed automatically every time a Spreadsheet is loaded
// Simple Triggers: "They cannot run for longer than 30 seconds."
function onOpen() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var menuEntries = [];
    menuEntries.push({ name: "Check for Health Status of Elastic Groups", functionName: "updateStatusCol" });
    menuEntries.push({ name: "Check for Latest Event Col of Elastic Groups", functionName: "updateLatestMUEventCol" });
    menuEntries.push({ name: "Check for Members Total Col of Elastic Groups", functionName: "updateMembersCol" });
    ss.addMenu("Custom Scripts", menuEntries);
}

// --------------------------------------------------------------------------------------
// --------Update Columns---------------------------------------------------------------
// --------------------------------------------------------------------------------------

// "Installable" Triggers

function triggerOnOpenHealthStatusUpdate() {
    var elasticGPss = SpreadsheetApp.getActive();
    ScriptApp.newTrigger('updateStatusCol')
        .forSpreadsheet(elasticGPss)
        .onOpen()
        .create();
}

function triggerOnOpenLatestEventUpdate() {
    var elasticGPss = SpreadsheetApp.getActive();
    ScriptApp.newTrigger('updateLatestMUEventCol')
        .forSpreadsheet(elasticGPss)
        .onOpen()
        .create();
}

function triggerOnOpenLatestEventUpdate() {
    var elasticGPss = SpreadsheetApp.getActive();
    ScriptApp.newTrigger('updateMembersCol')
        .forSpreadsheet(elasticGPss)
        .onOpen()
        .create();
}
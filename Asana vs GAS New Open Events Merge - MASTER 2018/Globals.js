// Used to help build: https://stackoverflow.com/questions/30188226/creating-asana-tasks-from-google-apps-script
// Combo'd with API Documentation and Trial & Error

// DONE: replace "Meetup Event ID" in Custom Fields with "external" value of Tasks
// Supposedly requires OAuth though... currently using a personal token... it seems to work for now...
// And reversed... or rather doing both... can write to "external" but not "read"
// TODO:need to figure out Authentication

// --------------------------------------------------------------------------------------

// Project ID of this SCRIPT: 1LovUfjwlp8ELCx_VWdHIIdYsObYJE93qoHhTgfa-9AMXyRcbYU5IcyO4

// Project ID of SHEET: 1DvDXjJBnvwW2q_MILkwkLew5dyhDc5O9Df-9g62qLjA
// Updates this sheet, currently: https://docs.google.com/spreadsheets/d/1DvDXjJBnvwW2q_MILkwkLew5dyhDc5O9Df-9g62qLjA/edit#gid=0

// Pulls from "Country & Regions" spreadsheet: https://docs.google.com/a/elastic.co/spreadsheets/d/1i1gSUuWM003hFy5WVtH2GwHF-emiUDj9GGfuwV2NcZ8/edit?usp=sharing

// TODO: handle with Meetup API calls flop?

// --------------------------------------------------------------------------------------
var MEETUP_KEY = "5707856e62502064217971651d4e18";

// --------------------------------------------------------------------------------------
var personal_access_token = "0/82b5ce5daa6e22488aade2c32c90ad51"; // *cough* yes, yes, not suposed to hard code it *cough*
var workspace_id = 12838292133436;
var assignee = "heather.ransome@elastic.co";
var LIMIT = 100;

// --------------------------------------------------------------------------------------
// TODO: split into Regions?
var MEMBER_IDS = [188225579, 187048917, 188381700, 188229096, 190808743, 188267880, 188267987, 188268099,
    188268160, 188268231, 188827514, 186996767, 191550044, 186910125, 186996554, 186996912,
    187180131, 187184904, 187185399, 187185691, 187188250, 187186766, 187186877
];
// --------------------------------------------------------------------------------------
// Globals - GOOGLE APPS SCRIPT
// --------------------------------------------------------------------------------------
// Sheets & Dictionaries
var SHEETURL = "https://docs.google.com/a/elastic.co/spreadsheets/d/1DvDXjJBnvwW2q_MILkwkLew5dyhDc5O9Df-9g62qLjA/";
var SHEET = SpreadsheetApp.openByUrl(SHEETURL).getSheetByName("New Events");
var regionCountrySHEETURL = "https://docs.google.com/spreadsheets/d/1i1gSUuWM003hFy5WVtH2GwHF-emiUDj9GGfuwV2NcZ8/";
var regionCountrySHEET = SpreadsheetApp.openByUrl(regionCountrySHEETURL).getSheetByName("Country Regions");
var regionUSstateSHEET = SpreadsheetApp.openByUrl(regionCountrySHEETURL).getSheetByName("US Regions");
var regionCAstateSHEET = SpreadsheetApp.openByUrl(regionCountrySHEETURL).getSheetByName("CA Regions");

var countryLISTisoA2 = regionCountrySHEET.getSheetValues(2, getColByNameFromSheet(regionCountrySHEET, "A2 (ISO)"), regionCountrySHEET.getLastRow() - 1, 1);
var countryLISTregion = regionCountrySHEET.getSheetValues(2, getColByNameFromSheet(regionCountrySHEET, "Region"), regionCountrySHEET.getLastRow() - 1, 1);

var stateLISTabbrev = regionUSstateSHEET.getSheetValues(2, getColByNameFromSheet(regionUSstateSHEET, "Abbrev", "US Regions"), regionUSstateSHEET.getLastRow() - 1, 1);
var stateLISTregion = regionUSstateSHEET.getSheetValues(2, getColByNameFromSheet(regionUSstateSHEET, "Region", "US Regions"), regionUSstateSHEET.getLastRow() - 1, 1);

var provinceLISTabbrev = regionCAstateSHEET.getSheetValues(2, getColByNameFromSheet(regionCAstateSHEET, "Postal abbreviation"), regionCAstateSHEET.getLastRow() - 1, 1);
var provinceLISTregion = regionCAstateSHEET.getSheetValues(2, getColByNameFromSheet(regionCAstateSHEET, "Three-region model"), regionCAstateSHEET.getLastRow() - 1, 1);

var regionDICT = createRegionDictionary();
var regionUSsubDICT = createUSsubRegionDictionary();
var regionCAsubDICT = createCAsubRegionDictionary();


// --------------------------------------------------------------------------------------
// Globals - ASANA
// --------------------------------------------------------------------------------------

// Project: User Groups
var project_id_user_groups = 420524365418595;

// Project: User Groups: Section/Columns
var section_id_pending_validation_groups = 444700372303532;
var section_id_phase0 = 420524365418597;
var section_id_phase1;
var section_id_phase2 = 420524365418599;
var section_id_phase3;
var section_id_in_the_wild_groups;

// Custom Fields
var custom_field_id_url_group = 440204579700571;
var custom_field_founded = 444704848456621;
var custom_field_membership = 444704848456623;
var custom_field_branding = 445801260249011;
var custom_field_CoC = 445801260249015;

var custom_field_index_ID = 463246496171133;

// Tags: Phases
var tags_phase0;
var tags_phase1;
var tags_phase2;
var tags_phase3 = 420496974293961;

// Tags: Regions
var region_tags = {
    "North America": 420496974293957,
    "South America": 443695152104306,
    "EMEA": 435688553292123,
    "APJ": 443695152104307,
    "Region:Unknown": 453439284363860
};

// Tags: Subregions
var region_na_tags = {
    "West (US)": 420496974293959,
    "Central (US)": 443695152104308,
    "NEUS": 435566655025420,
    "SEUS": 443695152104309,
    "Region:Unknown": 453439284363860
};

// Add CA Subregions

// --------------------------------------------------------------------------------------
// Project: Events
var project_id_events = 420524365418591;

// Project: Events: Section/Columns
var section_id_pending_validation = 420682948633462;
var section_id_needs_attention;
var section_id_in_progress;
var section_id_in_the_wild;
var section_id_tracking_only = 420682948633464;
var section_id_done;

// Custom Fields
var custom_field_id_status = 229696952935993;
var custom_field_id_url = 440204579700571;
var custom_field_id_RSVPs = 443557655952885;

// Tags
var keyword_tags = {
    "elasticsearch": 420496974293971,
    "logstash": 443695152104301,
    "kibana": 443695152104302,
    "elastic stack": 443695152104303
};

var tags_meetup = 420496974293960;
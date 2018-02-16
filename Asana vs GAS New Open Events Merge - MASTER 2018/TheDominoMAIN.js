// Catching: TBAs, Happy Hours, etc. - Related events that do not have keywords
function checkForDevRelSpecificMUevents() {
    for (counter = 0; counter < MEMBER_IDS.length; counter++) {
        pullMUeventsByMemberID(MEMBER_IDS[counter]);
    };
}

// Catching: Elastic Group Events that are not member specific; "ByKeyword" is not catching everything
function checkForElasticGroupEvents() {
    // TODO
    // Don't forget to set status to "upcoming"
}

// --------------------------------------------------------------------------------------
// --------The Domino That Started It All------------------------------------------------
// --------------------------------------------------------------------------------------
function MAINsearchEventsForKeywords() {
    pullNewMUeventsByKeyword("kibana");
    pullNewMUeventsByKeyword("logstash");
    pullNewMUeventsByKeyword("elasticsearch");
    pullNewMUeventsByKeyword("elastic stack"); // "and_text" is set to True
    checkForDevRelSpecificMUevents();
    // checkForElasticGroupEvents();
};
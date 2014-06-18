/**
 * @file
 * Match objects.
 */

var EventEmitter = require('events').EventEmitter;

/**
 * Match constructor.
 *
 * Represents a match in progress.
 *
 * @param String language
 *   The prefered language for team names.
 */
var Match = function (language) {
    this.language = language;
    this.initialized = false;
};

Match.prototype = new EventEmitter();

/**
 * Extracts important data from the match data and updates the match.
 *
 * @param Object matchData
 *   Match object parsed from the FIFA api.
 */
Match.prototype.update = function (matchData) {
    var score = matchData.c_Score;
    var live = matchData.b_Live;
    this.data = matchData;

    if (!this.initialized) {
        this.homeTeam = this.data['c_HomeTeam_' + this.language];
        this.awayTeam = this.data['c_AwayTeam_' + this.language];
        this.url = this.data['c_ShareURL_' + this.language];
        console.log(this.url);
        this.score = '';
        this.live = false;
        this.initialized = true;
    }

    if (live != this.live) {
        this[(live ? 'start' : 'end') + 'Match']();
    } else if (score != this.score) {
        this.updateScore(score);
    }
};

/**
 * Handles the match starting.
 *
 * Sets live to true and emits the startMatch event.
 */
Match.prototype.startMatch = function () {
    console.log("start");
    this.live = true;
    this.emit('startMatch', this);
};

/**
 * Handles the match ending.
 *
 * Sets live to false and emits the endMatch event.
 */
Match.prototype.endMatch = function () {
    console.log("end");
    this.live = false;
    this.emit('endMatch', this);
};

/**
 * Handles score changes.
 *
 * Updates the internal score and emits the scoreChange event.
 */
Match.prototype.updateScore = function (score) {
    console.log("score");
    this.score = score;
    this.emit('updateScore', this);
};

module.exports = Match;

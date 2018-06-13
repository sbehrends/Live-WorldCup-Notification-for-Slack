/**
 * @file
 * Match objects.
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * Match constructor.
 *
 * Represents a match in progress.
 *
 * @param String language
 *   The prefered language for team names.
 */
var Match = function (language) {
    EventEmitter.call(this);
    this.language = language;
    this.initialized = false;
};

util.inherits(Match, EventEmitter);

Match.prototype.getScore = function (matchData) {
    return `${matchData.HomeTeam.Score} - ${matchData.AwayTeam.Score}`;
}

/**
 * Extracts important data from the match data and updates the match.
 *
 * @param Object matchData
 *   Match object parsed from the FIFA api.
 */
Match.prototype.update = function (matchData) {
    var score = this.getScore(matchData);
    var live = typeof matchData.MatchTime === 'string';
    this.data = matchData;

    if (!this.initialized) {
        this.homeTeam = this.data.HomeTeam.TeamName[0].Description
        this.awayTeam = this.data.AwayTeam.TeamName[0].Description
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

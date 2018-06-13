require('dotenv').config()
const requestify = require("requestify");
const async = require("async");
const cron = require("cron");
const Match = require("./Match");
const activeMatches = {};
const competitionIdToCrawl = process.env.COMPETITION_ID || '17'; // 2018 WC | use "all" to dont filter
const cronJobTime = process.env.CRON_TIME || '*/5 * * * * *';

// Create an incoming webhook
var slack = require('slack-notify')(process.env.SLACKHOOK);

// Load configuration.
var DEFAULT_ICON_URL = 'https://en.wikipedia.org/wiki/2018_FIFA_World_Cup#/media/File:2018_FIFA_World_Cup.svg';
var botName = process.env.BOTNAME || 'WorldCupBot';
var iconUrl = (process.env.ICON_URL || DEFAULT_ICON_URL);
var channelName = '#' + (process.env.CHANNEL || 'random');
var language = process.env.LANGUAGE || 'en';
var startExpression;
var stopExpression;
if (language == 'es') {
    startExpression = 'Comienza';
    stopExpression = 'Finaliza';
} else if (language == 'pt') {
    startExpression = 'Começa';
    stopExpression = 'Termina';
} else {
    startExpression = 'Starts';
    stopExpression = 'Ends';
}

/**
 * Wraps text in a slack-formatted link.
 */
var slackLink = function (text, url) {
    return '<' + url + '|' + text + '>';
};

/**
 * Sends a message to slack.
 */
var announce = function (text) {
    console.log(text);
    slack.send({
        channel: channelName,
        text: text,
        username: botName,
        icon_url: iconUrl,
    });
};

/**
 * Sends a "Match Starting" message to slack.
 */
var announceMatchStart = function (match) {
    var vs = match.homeTeam + ' vs ' + match.awayTeam;
    announce(`${startExpression} ${vs}`);
};

/**
 * Sends a "Match Complete" message to slack, and stops tracking the match.
 */
var announceMatchComplete = function (match) {
    var vs = match.homeTeam + ' vs ' + match.awayTeam;
    var stadium = match.data.c_Stadidum + ', ' + match.data.c_City;
    var text = stopExpression + ' ' + slackLink(vs, match.url) + ' (' + stadium + ')';
    announce(text);
    delete(activeMatches[match.data.n_MatchID]);
};

/**
 * Sends a score summary message to slack.
 */
var announceScore = function (match) {
    announce(match.homeTeam + ' (' + match.score + ') ' + match.awayTeam);
};

var cronJob = cron.job(cronJobTime, function(){
    requestLiveMatches(competitionIdToCrawl);
});
console.log('Cron Started')
cronJob.start();

async function requestLiveMatches(competitionId) {
    const url = 'https://api.fifa.com/api/v1/live/football/now?language=en-GB&count=500';
    const response = await requestify.get(url);
    let filteredMatches = response.getBody().Results;
    if (competitionId !== 'all') {
        filteredMatches = filteredMatches.filter(item => item.IdCompetition === competitionId)
    }

    filteredMatches.forEach((match) => {
        let matchInstance
        if (activeMatches[match.IdMatch]) {
            matchInstance = activeMatches[match.IdMatch];
        } else {
            matchInstance = new Match(language);
            matchInstance.on('startMatch', announceMatchStart);
            matchInstance.on('endMatch', announceMatchComplete);
            matchInstance.on('updateScore', announceScore);
            activeMatches[match.IdMatch] = matchInstance;
        }

        matchInstance.update(match);
    })
}

var requestify = require("requestify");
var async = require("async");
var cron = require("cron");
var Match = require("./Match");
var activeMatches = {};

// Create an incoming webhook
var slack = require('slack-notify')(process.env.SLACKHOOK);

// Load configuration.
var DEFAULT_ICON_URL = 'http://worldcupzones.com/wp-content/uploads/2014/05/the-2014-fifa-world-cup-in46.jpg';
var botName = process.env.BOTNAME || 'WorldCupBot';
var iconUrl = (process.env.ICON_URL || DEFAULT_ICON_URL);
var channelName = '#' + (process.env.CHANNEL || 'random');
var language = process.env.LANGUAGE || 'en';
var startExpression;
var stopExpression;
if (language == 'es') {
    startExpression = 'Comienza';
    startExpression = 'Finaliza';
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
    var stadium = match.data.c_Stadium + ', ' + match.data.c_City;
    var text = startExpression + ' ' + slackLink(vs, match.url) + ' (' + stadium + ')';
    announce(text);
};

/**
 * Sends a "Match Complete" message to slack, and stops tracking the match.
 */
var announceMatchComplete = function (match) {
    var vs = match.homeTeam + ' vs ' + match.awayTeam;
    var stadium = match.data.c_Stadium + ', ' + match.data.c_City;
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

var cronJob = cron.job("*/5 * * * * *", function(){


      // Get Match list
      requestify.get('http://live.mobileapp.fifa.com/api/wc/matches').then(function(response) {
            var matches = response.getBody().data.group;

            async.filter(matches, function(item, callback) {
               callback (item.b_Live == true || activeMatches[item.n_MatchID]);

      }, function(results){
          for (var i = 0; i < results.length; i += 1) {
              if (activeMatches[results[i].n_MatchID]) {
                  match = activeMatches[results[i].n_MatchID];
              } else {
                  match = new Match(language);
                  match.on('startMatch', announceMatchStart);
                  match.on('endMatch', announceMatchComplete);
                  match.on('updateScore', announceScore);
                  activeMatches[results[i].n_MatchID] = match;
              }

              match.update(results[i]);
          }
    });

      });
});
cronJob.start();
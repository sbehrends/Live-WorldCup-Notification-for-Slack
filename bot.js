var requestify = require("requestify");
var async = require("async");

// Create an incoming webhook
var slack = require('slack-notify')(process.env.SLACKHOOK);
var DEFAULT_ICON_URL = 'http://worldcupzones.com/wp-content/uploads/2014/05/the-2014-fifa-world-cup-in46.jpg';

var matchID = "",
matchScore = "",
match;


var cron = require('cron');
var cronJob = cron.job("*/5 * * * * *", function(){


      // Get Match list
      requestify.get('http://live.mobileapp.fifa.com/api/wc/matches').then(function(response) {
            var matches = response.getBody().data.group;

            async.filter(matches, function(item, callback) {
               callback (item.b_Live == true);

      }, function(results){

            match = results[0];

            if (typeof match == "object") {
                  // Got Live Match!

                  var iconUrl = (process.env.ICON_URL || DEFAULT_ICON_URL);
                  var channelName = '#' + (process.env.CHANNEL || 'random');
                  var homeTeamField = 'c_HomeTeam_' + (process.env.LANGUAGE || 'en');
                  var awayTeamField = 'c_AwayTeam_' + (process.env.LANGUAGE || 'en');
                  var shareUrlField = 'c_ShareURL_' + (process.env.LANGUAGE || 'en');
                  var startExpression
                  if (process.env.LANGUAGE == 'es') {
                        startExpression = 'Comienza';
                  } else if (process.env.LANGUAGE == 'pt') {
                        startExpression = 'Começa';
                  } else {
                        startExpression = 'Starts';
                  }

                  if (match.n_MatchID != matchID) {
                              // New Match just started

                              matchID = match.n_MatchID;
                              matchScore = ''

                              // Notify New match
                              var text = startExpression + ' <' + match[shareUrlField] + '|' + match[homeTeamField] + ' vs ' + match[awayTeamField] +
                                    '> (' + match.c_Stadium + ', ' + match.c_City + ')';

                              console.log(text)
                              slack.send({
                                   channel: channelName,
                                   text: text,
                                   username: 'WorldCupBot',
                                   icon_url: iconUrl
                             });


                        } else if (matchScore != match.c_Score) {
                              // Different Score

                              matchScore = match.c_Score

                              var text = match[homeTeamField]+ ' '+match.c_Score+' '+match[awayTeamField]+' ';

                              // Notify goal
                              console.log(text)

                              slack.send({
                                   channel: channelName,
                                   text: text,
                                   username: 'WorldCupBot',
                                   icon_url: iconUrl
                             });

                        }

                  }



            });

      });
});
cronJob.start();
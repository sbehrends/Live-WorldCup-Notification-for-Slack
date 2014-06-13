var requestify = require("requestify");
var async = require("async");

// Create an incoming webhook
var slack = require('slack-notify')(process.env.SLACKHOOK);


var matchID = "",
	matchScore = "",
	match;


var cron = require('cron');
var cronJob = cron.job("* * * * * *", function(){


	// Get Match list
	requestify.get('http://live.mobileapp.fifa.com/api/wc/matches').then(function(response) {
	    var matches = response.getBody().data.group;

	    async.filter(matches, function(item, callback) {
	        callback (item.b_Live == true);

	    }, function(results){

            match = results[0];

            if (typeof match == "object") {
            	// Got Live Match!

                  var channelName = '#' + (process.env.CHANNEL || 'random');

                  var homeTeamField = 'c_HomeTeam_' + (process.env.LANGUAGE || 'en');
                  var awayTeamField = 'c_AwayTeam_' + (process.env.LANGUAGE || 'en');
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
            		var text = startExpression+' '+match[homeTeamField]+ ' vs '+match[awayTeamField];
            		console.log(text)
            		slack.send({
					  channel: channelName,
					  text: text,
					  username: 'WorldCupBot'
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
					  username: 'WorldCupBot'
					});

            	}

            }



	    });

	});
});
cronJob.start();
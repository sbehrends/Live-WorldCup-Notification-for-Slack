var requestify = require("requestify");
var async = require("async");

// Create an incoming webhook
var slack = require('slack-notify')('https://gangoffourorfive.slack.com/services/hooks/incoming-webhook?token=OL71Lcjpm0BcrqMMkzInIIoo');


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

            	if (match.n_MatchID != matchID) {
            		// New Match just started

            		matchID = match.n_MatchID;
            		matchScore = ''

            		// Notify New match
            		var text = 'Começa '+match.c_HomeTeam_pt+ ' vs '+match.c_AwayTeam_pt;
            		console.log(text)
            		slack.send({
					  channel: '#random',
					  text: text,
					  username: 'WorldCupBot'
					});


            	} else if (matchScore != match.c_Score) {
            		// Different Score

            		matchScore = match.c_Score

            		var text = match.c_HomeTeam_pt+ ' '+match.c_Score+' '+match.c_AwayTeam_pt+' ';

            		// Notify goal
            		console.log(text)

            		slack.send({
					  channel: '#random',
					  text: text,
					  username: 'WorldCupBot'
					});

            	}

            }



	    });

	});
});
cronJob.start();
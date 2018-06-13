const fetch = require('node-fetch')
const cron = require('cron')
const Match = require('./Match')
const activeMatches = {}

async function requestLiveMatches(competitionId, events, language) {
  const url = 'https://api.fifa.com/api/v1/live/football/now?language=en-GB&count=500'
  const response = await fetch(url)
  let json = await response.json()
  let filteredMatches = json.Results
  if (competitionId !== 'all') {
      filteredMatches = filteredMatches.filter(item => item.IdCompetition === competitionId)
  }
  console.log('Matches ', filteredMatches.length)

  filteredMatches.forEach((match) => {
      let matchInstance
      if (activeMatches[match.IdMatch]) {
        matchInstance = activeMatches[match.IdMatch]
      } else {
        matchInstance = new Match(language)
        matchInstance.on('startMatch', events.announceMatchStart)
        matchInstance.on('endMatch', events.announceMatchComplete)
        matchInstance.on('updateScore', events.announceScore)
        activeMatches[match.IdMatch] = matchInstance
      }
      matchInstance.update(match)
  })
}

function startCron(competitionIdToCrawl = 'all', cronJobTime = '*/5 * * * * *', events, language) {
  console.log(`Cron started for ${competitionIdToCrawl} > ${cronJobTime}`)
  const CronJob = cron.job(cronJobTime, function(){
    requestLiveMatches(competitionIdToCrawl, events, language);
  })
  CronJob.start()
}

module.exports = {
  startCron,
  requestLiveMatches,
}
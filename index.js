require('dotenv').config()
const config = require('./config')
const { send } = require('micro')
const { router, get } = require('microrouter')
const redirect = require('micro-redirect')
const staticHandler = require('serve-handler')
const url = require('url')

const fetch = require('node-fetch')
const  { IncomingWebhook } = require('@slack/client')
const Crawler = require('./Crawler')

const mongoose = require('mongoose')
mongoose.connect(config.mongoUrl)
const Schema = mongoose.Schema
const SlackTeam = mongoose.model('SlackTeam', { teamName: String, teamId: String, accessToken: String, incomingWebhook: Schema.Types.Mixed })


Crawler.startCron(config.competitionIdToCrawl, config.cronJobTime, {
  announceMatchStart: (match) => {
    notifyTeams(`Match starting: ${match.homeTeam} vs ${match.awayTeam}`)
  },
  announceMatchComplete: (match) => {
    notifyTeams(`Match finished: ${match.homeTeam} ${match.score} ${match.awayTeam}`)
  },
  announceScore: (match) => {
    notifyTeams(`Match update ${match.data.MatchTime}: ${match.homeTeam} ${match.score} ${match.awayTeam}`)
  },
}, config.language)

async function notifyTeams(text) {
  console.log(`> Notify teams: ${text}`)
  const teams = await SlackTeam.find()
  teams.forEach(async (team) => {
    const webhook = new IncomingWebhook(team.incomingWebhook.url)
    await webhook.send(text)
  })
}

const notfound = (req, res) => send(res, 404, 'Not found route')

const static = async (req, res) => {
  await staticHandler(req, res, {
    'public': 'static'
  })
}

const authRedirect = async (req, res) => {
  redirect(res, 302, `https://slack.com/oauth/authorize?client_id=${config.slack.clientId}&scope=incoming-webhook&redirect_uri=${config.slack.redirectUri}`)
}

const slackAuthCallback = async (req, res) => {
  const fields = url.parse(req.url, true).query
  if (typeof fields.code !== 'string') {
    // TODO: Invalid callback
    return send(res, 502, {error: true})
  }
  const oauthAccess = await fetch(`https://slack.com/api/oauth.access?code=${fields.code}&client_id=${config.slack.clientId}&client_secret=${config.slack.clientSecret}&redirect_uri=${config.slack.redirectUri}`)
  const oauthRes = await oauthAccess.json()
  // console.log()
  if (!oauthRes.ok) {
    // TODO: Error con validation
    return send(res, 502, {error: true})
  }
  const newTeam = new SlackTeam({
    teamName: oauthRes.team_name,
    teamId: oauthRes.team_id,
    accessToken: oauthRes.access_token,
    incomingWebhook: oauthRes.incoming_webhook })
  await newTeam.save()
  send(res, 200, {fields, oauthRes})
}

module.exports = router(
  get('/auth', authRedirect),
  get('/auth/callback', slackAuthCallback),
  get('*', static),
)


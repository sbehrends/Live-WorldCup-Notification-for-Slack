module.exports = {
  slack: {
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_SECRET || '',
    redirectUri: process.env.SLACK_REDIRECT_URI || ''
  },
  competitionIdToCrawl: process.env.COMPETITION_ID || '17', // 2018 WC | use "all" to dont filter
  cronJobTime: process.env.CRON_TIME || '*/10 * * * * *',
  language: process.env.LANGUAGE || 'en',
  mongoUrl: process.env.MONGO_URL || '',
}

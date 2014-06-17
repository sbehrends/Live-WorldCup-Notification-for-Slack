Live-WorldCup-Notification-for-Slack
====================================

It's a NodeJS worker that request every 5 seconds data from the FIFA World Cup API and notifies via Slack API (It's possible to apply other ways of notification) the changes of the match.

====================================

+ It notifies when a match starts
+ It notifies when the score changes (this means Goal or the match finished)

It is posible to run it as a worker on Heroku :)

## Configurations

### Slack Web Hook

You need to add an Incoming WebHooks integration in Slack settings. Slack will provide a URL, it must be configured on heroku.

Example:
```
SLACKHOOK=https://yourslackdomain.slack.com/services/hooks/incoming-webhook?token=SomeSecretToken
```

### Language

The default language is English (en) but you can configure others, like Portuguese(pt) or Spanish(es). To configure simply set an environment variable in heroku named LANGUAGE.

Example:
```
LANGUAGE=pt
```

### Channel

The default channel is #random but you can change that setting a CHANNEL environnment variable.

Example:
```
CHANNEL=general
```
### Icon Image

You can change the default bot icon/avatar by setting a ICON_URL environment variable.

Example:
```
ICON_URL=http://worldcupzones.com/wp-content/uploads/2014/05/the-2014-fifa-world-cup-in46.jpg
```

### Bot Name

You can change the default bot name by setting a BOTNAME environment variable.

Example:
```
BOTNAME=SportsBot5000
```

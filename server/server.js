'use strict'

var loopback = require('loopback')
var boot = require('loopback-boot')
var app = module.exports = loopback()
let bodyParser = require('body-parser')
let session = require('express-session')
let cookieParser = require('cookie-parser')
var loopbackPassport = require('loopback-component-passport')
var PassportConfigurator = loopbackPassport.PassportConfigurator
var passportConfigurator = new PassportConfigurator(app)

// Build the providers/passport config
let config = {}
try {
  config = require('../providers.json')
} catch (err) {
  console.trace(err)
  process.exit(1) // fatal
}
// to support JSON-encoded bodies
app.middleware('parse', bodyParser.json())
// to support URL-encoded bodies
app.middleware('parse', bodyParser.urlencoded({
  extended: true
}))
app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started')
    var baseUrl = app.get('url').replace(/\/$/, '')
    console.log('Web server listening at: %s', baseUrl)
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath)
    }
  })
}

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
app.use(loopback.token({
  model: app.models.accessToken
}))
boot(app, __dirname, function (err) {
  if (err) throw err

  // start the server if `$ node server.js`
  if (require.main === module) { app.start() }
})
app.middleware('session:before', cookieParser(app.get('cookieSecret')))

app.middleware('session', session({
  secret: 'kitty',
  saveUninitialized: true,
  resave: true,
  cookie: { secure: true }
}))

passportConfigurator.init()
app.use(loopback.token({
  model: app.models.accessToken,
  currentUserLiteral: 'me'
}))
app.middleware('auth', loopback.token({
  model: app.models.accessToken
}))
// We need flash messages to see passport errors
passportConfigurator.setupModels({
  userModel: app.models.user,
  userIdentityModel: app.models.userIdentity,
  userCredentialModel: app.models.userCredential
})
for (let s in config) {
  let c = config[s]
  c.session = c.session !== false
  passportConfigurator.configureProvider(s, c)
}

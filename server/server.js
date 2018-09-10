// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-example-passport
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
'use strict'
let loopback = require('loopback')
let boot = require('loopback-boot')
let app = module.exports = loopback()
let cookieParser = require('cookie-parser')
let session = require('express-session')
let flash = require('express-flash')
let utils = require('loopback-component-passport/lib/models/utils')
let bodyParser = require('body-parser')
let loopbackPassport = require('loopback-component-passport')
let PassportConfigurator = loopbackPassport.PassportConfigurator
let passportConfigurator = new PassportConfigurator(app)
let _ = require('lodash')

// Build the providers/passport config
let config = {}
try {
  config = require('../providers.js')
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
function customProfileToUser (provider, profile) {
  let userObject = {
    email: `${profile.username}@${provider}.fooname.ga`,
    username: provider + '.' + profile.username,
    baseUsername: profile.displayName,
    password: utils.generateKey('password'),
    bio: _.get(profile, '_json.description', null),
    handle: _.get(profile, '_json.screen_name', null),
    profileImage: _.get(profile, '_json.profile_image_url_https', null),
    bannerImage: _.get(profile, '_json.profile_banner_url', null)
  }
  return userObject
}
boot(app, __dirname, function (err) {
  if (err) throw err

  // start the server if `$ node server.js`
})
app.middleware('session:before', cookieParser('yourSecretKeyForCookies'))
app.middleware('session', session({
  // Todo Change this secret key for release
  secret: 'kitty',
  saveUninitialized: true,
  resave: true
}))

passportConfigurator.init()
app.use(loopback.token({
  model: app.models.accessToken,
  currentUserLiteral: 'me'
}))
app.use(flash())

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
  c.profileToUser = customProfileToUser
  passportConfigurator.configureProvider(s, c)
}
app.get('/api/auth/account', (req, res, next) => {
  let accessToken = req.accessToken.id
  res.redirect(`ga.fooname.app://login/user/profile/${accessToken}`)
})

// start the server if `$ node server.js`
if (require.main === module) {
  app.start()
}

const http = require('http')
const Twit = require('twit')

const express = require('express')
const passport = require('passport')
const Strategy = require('passport-twitter').Strategy
const rp = require('request-promise')
const _ = require('lodash')

const twitterConsumerKey = process.env.CONSUMER_KEY || ''
const twitterConsumerSecret = process.env.CONSUMER_SECRET || ''
passport.use(new Strategy({
  consumerKey: twitterConsumerKey,
  consumerSecret: twitterConsumerSecret,
  callbackURL: 'http://127.0.0.1:3000/login/twitter/return'
},
function (token, tokenSecret, profile, cb) {
  console.log('gonna get here')
  return cb(null, profile)
}))

passport.serializeUser(function (user, cb) {
  cb(null, user)
})

passport.deserializeUser(function (obj, cb) {
  cb(null, obj)
})

// Create a new Express application.
var app = express()

app.use(require('morgan')('combined'))
app.use(require('cookie-parser')())
app.use(require('body-parser').urlencoded({ extended: true }))
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }))

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize())
app.use(passport.session())

const serverPort = process.env.OPENSHIFT_NODEJS_PORT || 8080
//const server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
let weatherRequestOptions = {
  uri: 'https://api.openweathermap.org/data/2.5/weather',
  qs: {
    id: '112931',
    appId: '3235997ff734458b6e4a14e904a37707'
  },
  json: true
}
passport.use(new Strategy({
  consumerKey: twitterConsumerKey,
  consumerSecret: twitterConsumerSecret,
  callbackURL: 'http://127.0.0.1:8080/login/twitter/return'
},
function (token, tokenSecret, profile, cb) {
  let T = new Twit({
    consumer_key: twitterConsumerKey,
    consumer_secret: twitterConsumerSecret,
    access_token: token,
    access_token_secret: tokenSecret,
    timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
    strictSSL: true // optional - requires SSL certificates to be valid.
  })

  rp(weatherRequestOptions)
    .then(function (weather) {
      let weatherStatus = _.get(weather, 'weather[0].main', '')
      T.post('account/update_profile', { name: `Smile is so ${weatherStatus}` }, (err, data, response) => {
        console.log(data)
      })
    })
    .catch(function (err) {
      console.log(err)
    })

  return cb(null, profile)
}))

app.get('/login/twitter',
  passport.authenticate('twitter'))

app.get('/login/twitter/return',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/')
  })
app.listen(serverPort)

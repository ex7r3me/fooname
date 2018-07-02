const http = require('http')
const Twit = require('twit')

var express = require('express');
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;


passport.use(new Strategy({
        consumerKey: process.env.CONSUMER_KEY,
        consumerSecret: process.env.CONSUMER_SECRET,
        callbackURL: 'http://127.0.0.1:3000/login/twitter/return'
    },
    function(token, tokenSecret, profile, cb) {
        console.log('>',token)
        console.log('>>',tokenSecret)
        // In this example, the user's Twitter profile is supplied as the user
        // record.  In a production-quality application, the Twitter profile should
        // be associated with a user record in the application's database, which
        // allows for account linking and authentication with other identity
        // providers.
        return cb(null, profile);
    }));

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});


// Create a new Express application.
var app = express();

app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


const server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080
const server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

passport.use(new Strategy({
        consumerKey: process.env.CONSUMER_KEY,
        consumerSecret: process.env.CONSUMER_SECRET,
        callbackURL: 'http://127.0.0.1:3000/login/twitter/return'
    },
    function(token, tokenSecret, profile, cb) {
        console.log('>',token)
        console.log('>>',tokenSecret)
        return cb(null, profile);
    }));

const requestHandler = (request, response) => {
    console.log(request.url)
    response.end('Hello Node.js Server!')
}
const server = http.createServer(requestHandler)
server.listen(server_port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${server_port}`)
})
let T = new Twit({
    consumer_key:         process.env.CONSUMER_KEY,
    consumer_secret:      process.env.CONSUMER_SECRET,
    access_token:         '',
    access_token_secret:  '',
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
    strictSSL:            true,     // optional - requires SSL certificates to be valid.
})

//
//  tweet 'hello world!'
//
T.post('account/update_profile', { name: `smile is here` }, function(err, data, response) {
    console.log(data)
})
app.get('/login/twitter',
    passport.authenticate('twitter'));

app.get('/login/twitter/return',
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    });
app.listen(3000);


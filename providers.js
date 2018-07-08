module.exports = {
  'twitter-login': {
    'provider': 'twitter',
    'module': 'passport-twitter',
    'consumerKey': process.env.CONSUMER_KEY,
    'consumerSecret': process.env.CONSUMER_SECRET,
    'callbackURL': 'http://localhost:8080/api/auth/twitter/callback',
    'authPath': '/api/auth/twitter',
    'callbackPath': '/api/auth/twitter/callback',
    'successRedirect': '/api/auth/account'
  }
}

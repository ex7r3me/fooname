const rp = require('request-promise')
const Twit = require('twit')
const _ = require('lodash')
const openWeatherKey = process.env.OPENWEATHER_KEY || null
const twitterConsumerKey = process.env.CONSUMER_KEY || ''
const twitterConsumerSecret = process.env.CONSUMER_SECRET || ''

module.exports = function (UserModel) {
  UserModel.getWeatherByCityId = (cityId) => {
    let weatherRequestOptions = {
      uri: 'https://api.openweathermap.org/data/2.5/weather',
      qs: {
        id: cityId,
        appId: openWeatherKey
      },
      json: true
    }
    return rp(weatherRequestOptions)
  }
  UserModel.updateName = (credentials, name) => {
    let token = credentials.token
    let tokenSecret = credentials.tokenSecret
    if (token && tokenSecret) {
      let T = new Twit({
        consumer_key: twitterConsumerKey,
        consumer_secret: twitterConsumerSecret,
        access_token: token,
        access_token_secret: tokenSecret,
        timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
        strictSSL: true // optional - requires SSL certificates to be valid.
      })
      T.post('account/update_profile', {name}, (err, data) => {
        if (err) {
          return Promise.reject(err)
        } else {
          return Promise.resolve(data)
        }
      })
    }
  }
  UserModel.weatherIconToEmoji = (weatherIconCode) => {
    switch (weatherIconCode) {
      case '01d' : return '☀️'
      case '01n' : return '🌕'
      case '02d' : return '⛅'
      case '02n' : return '🌕️'
      case '03d' : return '☁️'
      case '03n' : return '☁️'
      case '04d' : return '☁️️'
      case '04n' : return '☁️'
      case '09d' : return '🌧️'
      case '09n' : return '🌧️'
      case '10d' : return '🌦️'
      case '10n' : return '🌧️'
      case '11d' : return '⛈️'
      case '11n' : return '⛈️'
      case '13d' : return '🌨️'
      case '13n' : return '🌨️'
      case '50d' : return '🌫️'
      case '50n' : return '🌫️'
      default: return '🌵'
    }
  }
  UserModel.updateAllUsersStatus = () => {
    UserModel.find()
      .then((users) => {
        return Promise.all(users.map(user => {
          if (_.isNumber(user.cityId)) {
            return UserModel.getWeatherByCityId(user.cityId)
              .then((weather) => {
                return {user, weather}
              })
          } else { return new Error('Invalid City ID for user') }
        }))
      })
      .then(results => {
        let updateUsersArray = results.map(result => {
          return ({user: result.user, weather: _.get(result, 'weather.weather[0]', '')})
        })
        return Promise.resolve(updateUsersArray)
      })
      .then(updateObjects => {
        Promise.all(updateObjects.map(updateObject => {
          let user = updateObject.user
          let baseUsername = _.isNil(user.baseUsername) ? '' : user.baseUsername
          let name = baseUsername + UserModel.weatherIconToEmoji(updateObject.weather.icon)
          user.identities((err, identity) => {
            if (err) { console.log(err) }
            let credentials = identity[0].credentials
            return UserModel.updateName(credentials, name)
          })
        }))
      })
  }
  UserModel.observe('before save', (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updateDate = new Date()
    } else {
      ctx.data.updateDate = new Date()
    }
    next()
  })
}

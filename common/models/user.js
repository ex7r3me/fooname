const request = require('request')
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
  UserModel.updateAllUsersStatus = () => {
    UserModel.find()
      .then((users) => {
        return Promise.all(users.map(user => {
          if (_.isNumber(user.cityId)) {
            return UserModel.getWeatherByCityId(112931).then((weather) => {
              return {user, weather}
            })
          } else { return new Error('Invalid City ID for user') }
        }))
      })
      .then(results => {
        let updateUsersArray = results.map(result => {
          return ({user: result.user, weather: _.get(result, 'weather.weather[0].description', '')})
        })
        return Promise.resolve(updateUsersArray)
      })
      .then(updateObjects => {
        Promise.all(updateObjects.map(updateObject => {
          let user = updateObject.user
          let name = updateObject.weather
          user.identities((err, identity) => {
            let credentials = identity[0].credentials
            return UserModel.updateName(credentials, name)
          })
        }))
      })
  }
}

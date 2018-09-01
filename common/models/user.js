const rp = require('request-promise')
const Twit = require('twit')
const _ = require('lodash')
const openWeatherKey = process.env.OPENWEATHER_KEY || null
const twitterConsumerKey = process.env.CONSUMER_KEY || ''
const twitterConsumerSecret = process.env.CONSUMER_SECRET || ''

module.exports = function (UserModel) {
  UserModel.getWeatherByCityId = cityId => {
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
  UserModel.updateCityIdByCoordination = (lat, lon, options) => {
    const userId = _.get(options, 'accessToken.userId', 0)
    if (userId) {
      return UserModel.getCityByCoordination(lat, lon)
        .then(result => {
          let cityId = _.get(result, 'id', false)
          let cityName = _.get(result, 'name', false)
          return { cityId, cityName }
        })
        .then(({ cityId, cityName }) => {
          if (cityId) {
            return UserModel.findById(userId).then(user =>
              user.updateAttributes({ cityId, cityName })
            )
          } else {
            throw Error('No city found')
          }
        })
    } else {
      return Promise.reject(new Error('No user found'))
    }
  }
  UserModel.getCityByCoordination = (lat, lon) => {
    let weatherRequestOptions = {
      uri: 'https://api.openweathermap.org/data/2.5/weather',
      qs: { lat, lon, appId: openWeatherKey },
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
      T.post('account/update_profile', { name }, (err, data) => {
        if (err) {
          return Promise.reject(err)
        } else {
          return Promise.resolve(data)
        }
      })
    }
  }
  UserModel.weatherIconToEmoji = weatherIconCode => {
    switch (weatherIconCode) {
      case '01d':
        return { emoji: '☀️', shortname: 'sunny' }
      case '01n':
        return { emoji: '🌕', shortname: 'full_moon' }

      case '02d':
        return { emoji: '⛅', shortname: 'partly_sunny' }

      case '02n':
        return { emoji: '🌕️', shortname: 'full_moon' }

      case '03d':
        return { emoji: '☁️', shortname: 'cloud' }

      case '03n':
        return { emoji: '☁️', shortname: 'cloud' }

      case '04d':
        return { emoji: '☁️️', shortname: 'cloud' }

      case '04n':
        return { emoji: '☁️', shortname: 'cloud' }

      case '09d':
        return { emoji: '🌧️', shortname: '' }

      case '09n':
        return { emoji: '🌧️', shortname: '' }

      case '10d':
        return { emoji: '🌦️', shortname: '' }

      case '10n':
        return { emoji: '🌧️', shortname: '' }

      case '11d':
        return { emoji: '⛈️', shortname: '' }

      case '11n':
        return { emoji: '⛈️', shortname: '' }

      case '13d':
        return { emoji: '🌨️', shortname: '' }

      case '13n':
        return { emoji: '🌨️', shortname: '' }

      case '50d':
        return { emoji: '🌫️', shortname: 'fog' }

      case '50n':
        return { emoji: '🌫️', shortname: 'fog' }

      default:
        return { emoji: '🌵', shortshortname: '' }
    }
  }
  UserModel.updateAllUsersStatus = () => {
    UserModel.find()
      .then(users => {
        return Promise.all(
          users.map(user => {
            if (_.isNumber(user.cityId)) {
              return UserModel.getWeatherByCityId(user.cityId).then(weather => {
                return { user, weather }
              })
            } else {
              return new Error('Invalid City ID for user')
            }
          })
        )
      })
      .then(results => {
        let updateUsersArray = results.map(result => {
          return {
            user: result.user,
            weather: _.get(result, 'weather.weather[0]', '')
          }
        })
        return Promise.resolve(updateUsersArray)
      })
      .then(updateObjects => {
        Promise.all(
          updateObjects.map(updateObject => {
            const user = updateObject.user
            const baseUsername = _.isNil(user.baseUsername)
              ? ''
              : user.baseUsername
            const {shortname, emoji} = UserModel.weatherIconToEmoji(updateObject.weather.icon)
            let name = baseUsername + emoji
            user.updateAttributes({ emoji: shortname })
            user.identities((err, identity) => {
              if (err) {
                console.log(err)
              }
              let credentials = identity[0].credentials
              return UserModel.updateName(credentials, name)
            })
          })
        )
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
  UserModel.remoteMethod('updateCityIdByCoordination', {
    accepts: [
      { arg: 'lat', type: 'number' },
      { arg: 'lon', type: 'number' },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' }
    ],
    returns: { root: true, type: 'object' },
    http: { path: '/coordination', verb: 'patch' }
  })
}

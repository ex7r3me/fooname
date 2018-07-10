module.exports = function (app) {
  app.dataSources.maindb.autoupdate('user', function (err) {
    if (err) throw err
    console.log('custom User model migrated')
    if (process.env.NODE_ENV === 'test') {
      let User = app.models.User
      User.create({
        email: 'test@fooname.ga',
        password: '123456'
      })
    }
  })
  app.dataSources.maindb.autoupdate('ACL', function (err) {
    if (err) throw err
    console.log('ACL model migrated')
  })
  app.dataSources.maindb.automigrate('Role', function (err) {
    if (err) throw err
    console.log('Role model migrated')
  })
  app.dataSources.maindb.autoupdate('userCredential', function (err) {
    if (err) throw err
    console.log('User Credential model migrated')
  })
  app.dataSources.maindb.autoupdate('userIdentity', function (err) {
    if (err) throw err
    console.log('User Identity model migrated')
  })
  app.dataSources.maindb.autoupdate('accessToken', function (err) {
    if (err) throw err
    console.log('Access Token model migrated')
  })
}

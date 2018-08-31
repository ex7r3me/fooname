module.exports = {
  maindb: {
    host: process.env.MONGO_HOST,
    port: process.env.MONGO_PORT,
    database: process.env.MONGO_DATABASE,
    password: process.env.MONGO_PASSWORD,
    name: 'maindb',
    user: process.env.MONGO_USER,
    connector: 'mongodb'
  }
}

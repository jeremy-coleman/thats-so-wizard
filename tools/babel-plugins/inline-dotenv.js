require('dotenv/config')

module.exports = function transformDotenvPlugin (babel) {
  return {
    name: 'transform-dotenv',
    inherits: require('./inline-vars')
  }
}
module.exports = {
  "env": {
    "node": true
  },
  "parserOptions": {
    "ecmaVersion": 6
  },
  "rules": {
  },
  "extends": "airbnb-base",
  overrides: [{
    files: ['test/**/*.js'],
    env: {
      mocha: true
    },
    rules: {
      "func-names": 0,
      "prefer-arrow-callback": 0,
      "no-unused-expressions": 0,
      'space-before-function-paren': 0
    },
  }]
}

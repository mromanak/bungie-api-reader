const _ = require('lodash')

let object = {
  foo: 'bar',
  baz: 'bash'
}

let array = [
  {
    id: 1,
    name: 'Swarmo'
  },
  {
    id: 2,
    name: 'Swarmo'
  },
  {
    id: 1,
    name: 'Swarmo Beta'
  }
]

console.log(_.map(object, (value, key) => `${key}: ${value}`).join(', '))
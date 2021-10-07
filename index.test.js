const generateSql = require('./index')

test('test jest', () => {
  expect(generateSql()).toEqual('test')
})

const generateSql = require('./index')

test('test postgresql with no query', () => {
  const dialect = 'postgresql'
  const query = { limit: null, where: null }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data;`)
})

test('test mysql with no query', () => {
  const dialect = 'mysql'
  const query = { limit: null, where: null }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data;`)
})

test('test sqlserver with no query', () => {
  const dialect = 'sqlserver'
  const query = { limit: null, where: null }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data;`)
})

test('test postgresql limit', () => {
  const dialect = 'postgresql'
  const query = { limit: 10, where: null }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data LIMIT 10;`)
})

test('test mysql limit', () => {
  const dialect = 'mysql'
  const query = { limit: 10, where: null }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data LIMIT 10;`)
})

test('test sqlserver limit', () => {
  const dialect = 'sqlserver'
  const query = { limit: 10, where: null }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT TOP 10 * FROM data;`)
})

test('test postgresql query', () => {
  const dialect = 'postgresql'
  /**
   * @type {import('./index').Query}
   */
  const query = { limit: null, where: ['=', ['field', 1], 'cam'] }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data WHERE name = 'cam';`)
})

test('test mysql query', () => {
  const dialect = 'mysql'
  /**
   * @type {import('./index').Query}
   */
  const query = { limit: null, where: ['=', ['field', 1], 'cam'] }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data WHERE name = 'cam';`)
})

test('test sqlserver query', () => {
  const dialect = 'mysql'
  /**
   * @type {import('./index').Query}
   */
  const query = { limit: null, where: ['=', ['field', 1], 'cam'] }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data WHERE name = 'cam';`)
})

test('test postgresql query and limit', () => {
  const dialect = 'postgresql'
  /**
   * @type {import('./index').Query}
   */
  const query = { limit: 20, where: ['=', ['field', 1], 'cam'] }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(
    `SELECT * FROM data WHERE name = 'cam' LIMIT 20;`
  )
})

test('test mysql query and limit', () => {
  const dialect = 'mysql'
  /**
   * @type {import('./index').Query}
   */
  const query = { limit: 20, where: ['=', ['field', 1], 'cam'] }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(
    `SELECT * FROM data WHERE name = 'cam' LIMIT 20;`
  )
})

test('test sqlserver query and limit', () => {
  const dialect = 'sqlserver'
  /**
   * @type {import('./index').Query}
   */
  const query = { limit: 20, where: ['=', ['field', 1], 'cam'] }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(
    `SELECT TOP 20 * FROM data WHERE name = 'cam';`
  )
})

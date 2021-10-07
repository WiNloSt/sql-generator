const generateSql = require('./index')

test('test postgres with no query', () => {
  const dialect = 'postgres'
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

test('test postgres limit', () => {
  const dialect = 'postgres'
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

test('test postgres query', () => {
  const dialect = 'postgres'
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

test('test postgres query and limit', () => {
  const dialect = 'postgres'
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

test('test postgres field, =', () => {
  const dialect = 'postgres'
  /**
   * @type {import('./index').Query}
   */
  const query = { where: ['=', ['field', 2], 'cam'] }
  const fields = { 1: 'id', 2: 'name' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data WHERE name = 'cam';`)
})

test('test mysql field, =, limit', () => {
  expect(
    generateSql('mysql', { 1: 'id', 2: 'name' }, { where: ['=', ['field', 2], 'cam'], limit: 10 })
  ).toEqual("SELECT * FROM data WHERE name = 'cam' LIMIT 10;")
})

describe('test from requirements section', () => {
  const fields = { 1: 'id', 2: 'name', 3: 'date_joined', 4: 'age' }

  test('test postgres field, = , nil', () => {
    expect(generateSql('postgres', fields, { where: ['=', ['field', 3], 'nil'] })).toEqual(
      'SELECT * FROM data WHERE date_joined IS NULL;'
    )
  })
})

const generateSql = require('./index')

test('postgres with no query', () => {
  const dialect = 'postgres'
  const query = { limit: null, where: null }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data;`)
})

test('mysql with no query', () => {
  const dialect = 'mysql'
  const query = { limit: null, where: null }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data;`)
})

test('sqlserver with no query', () => {
  const dialect = 'sqlserver'
  const query = { limit: null, where: null }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data;`)
})

test('postgres limit', () => {
  const dialect = 'postgres'
  const query = { limit: 10, where: null }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data LIMIT 10;`)
})

test('mysql limit', () => {
  const dialect = 'mysql'
  const query = { limit: 10, where: null }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data LIMIT 10;`)
})

test('sqlserver limit', () => {
  const dialect = 'sqlserver'
  const query = { limit: 10, where: null }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT TOP 10 * FROM data;`)
})

test('postgres query', () => {
  const dialect = 'postgres'
  /**
   * @type {import('./index').Query}
   */
  const query = { limit: null, where: ['=', ['field', 1], 'cam'] }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data WHERE "name" = 'cam';`)
})

test('mysql query', () => {
  const dialect = 'mysql'
  /**
   * @type {import('./index').Query}
   */
  const query = { limit: null, where: ['=', ['field', 1], 'cam'] }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data WHERE \`name\` = 'cam';`)
})

test('sqlserver query', () => {
  const dialect = 'sqlserver'
  /**
   * @type {import('./index').Query}
   */
  const query = { limit: null, where: ['=', ['field', 1], 'cam'] }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data WHERE "name" = 'cam';`)
})

test('postgres query and limit', () => {
  const dialect = 'postgres'
  /**
   * @type {import('./index').Query}
   */
  const query = { limit: 20, where: ['=', ['field', 1], 'cam'] }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(
    `SELECT * FROM data WHERE "name" = 'cam' LIMIT 20;`
  )
})

test('mysql query and limit', () => {
  const dialect = 'mysql'
  /**
   * @type {import('./index').Query}
   */
  const query = { limit: 20, where: ['=', ['field', 1], 'cam'] }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(
    `SELECT * FROM data WHERE \`name\` = 'cam' LIMIT 20;`
  )
})

test('sqlserver query and limit', () => {
  const dialect = 'sqlserver'
  /**
   * @type {import('./index').Query}
   */
  const query = { limit: 20, where: ['=', ['field', 1], 'cam'] }
  const fields = { 1: 'name', 2: 'location' }

  expect(generateSql(dialect, fields, query)).toEqual(
    `SELECT TOP 20 * FROM data WHERE "name" = 'cam';`
  )
})

test('postgres field, =', () => {
  const dialect = 'postgres'
  /**
   * @type {import('./index').Query}
   */
  const query = { where: ['=', ['field', 2], 'cam'] }
  const fields = { 1: 'id', 2: 'name' }

  expect(generateSql(dialect, fields, query)).toEqual(`SELECT * FROM data WHERE "name" = 'cam';`)
})

test('mysql field, =, limit', () => {
  expect(
    generateSql('mysql', { 1: 'id', 2: 'name' }, { where: ['=', ['field', 2], 'cam'], limit: 10 })
  ).toEqual("SELECT * FROM data WHERE `name` = 'cam' LIMIT 10;")
})

describe('test from requirements section', () => {
  const fields = { 1: 'id', 2: 'name', 3: 'date_joined', 4: 'age' }

  test('postgres field, = , nil', () => {
    expect(generateSql('postgres', fields, { where: ['=', ['field', 3], null] })).toEqual(
      'SELECT * FROM data WHERE "date_joined" IS NULL;'
    )
  })

  test('postgres field, >', () => {
    expect(generateSql('postgres', fields, { where: ['>', ['field', 4], 35] })).toEqual(
      'SELECT * FROM data WHERE "age" > 35;'
    )
  })

  test('postgres field, <, =, and', () => {
    expect(
      generateSql('postgres', fields, {
        where: ['and', ['<', ['field', 1], 5], ['=', ['field', 2], 'joe']],
      })
    ).toEqual(`SELECT * FROM data WHERE "id" < 5 AND "name" = 'joe';`)
  })

  test('postgres field, !=, =, or', () => {
    expect(
      generateSql('postgres', fields, {
        where: ['or', ['!=', ['field', 3], '2015-11-01'], ['=', ['field', 1], 456]],
      })
    ).toEqual(`SELECT * FROM data WHERE "date_joined" != '2015-11-01' OR "id" = 456;`)
  })

  test('postgres nested and or', () => {
    expect(
      generateSql('postgres', fields, {
        where: [
          'and',
          ['!=', ['field', 3], null],
          ['or', ['>', ['field', 4], 25], ['=', ['field', 2], 'Jerry']],
        ],
      })
    ).toEqual(
      `SELECT * FROM data WHERE "date_joined" IS NOT NULL AND ("age" > 25 OR "name" = 'Jerry');`
    )
  })

  test('postgres nested or and', () => {
    expect(
      generateSql('postgres', fields, {
        where: [
          'or',
          ['!=', ['field', 3], null],
          ['and', ['>', ['field', 4], 25], ['=', ['field', 2], 'Jerry']],
        ],
      })
    ).toEqual(
      `SELECT * FROM data WHERE "date_joined" IS NOT NULL OR ("age" > 25 AND "name" = 'Jerry');`
    )
  })

  test('postgres = (IN)', () => {
    expect(generateSql('postgres', fields, { where: ['=', ['field', 4], 25, 26, 27] })).toEqual(
      'SELECT * FROM data WHERE "age" IN (25, 26, 27);'
    )
  })

  test('postgres != (IN)', () => {
    expect(generateSql('postgres', fields, { where: ['!=', ['field', 4], 25, 26, 27] })).toEqual(
      'SELECT * FROM data WHERE "age" NOT IN (25, 26, 27);'
    )
  })

  test('single and operand', () => {
    expect(
      generateSql('postgres', fields, {
        where: ['or', ['!=', ['field', 3], null], ['and', ['>', ['field', 4], 25]]],
      })
    ).toEqual(`SELECT * FROM data WHERE "date_joined" IS NOT NULL OR "age" > 25;`)
  })
})

describe('Test with fields', () => {
  const fields = { 1: 'id', 2: 'name', 3: 'date_joined', 4: 'age' }

  test('multiple conditions in or', () => {
    expect(
      generateSql('postgres', fields, {
        where: [
          'or',
          ['!=', ['field', 3], null],
          ['>', ['field', 4], 25],
          ['=', ['field', 2], 'John'],
        ],
      })
    ).toEqual(
      `SELECT * FROM data WHERE "date_joined" IS NOT NULL OR "age" > 25 OR "name" = 'John';`
    )
  })

  test('multiple conditions in and', () => {
    expect(
      generateSql('postgres', fields, {
        where: [
          'and',
          ['!=', ['field', 3], null],
          ['>', ['field', 4], 25],
          ['=', ['field', 2], 'John'],
        ],
      })
    ).toEqual(
      `SELECT * FROM data WHERE "date_joined" IS NOT NULL AND "age" > 25 AND "name" = 'John';`
    )
  })
})

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
})

describe('Test with fields', () => {
  const fields = { 1: 'id', 2: 'name', 3: 'date_joined', 4: 'age' }

  test('single nested and operand', () => {
    expect(
      generateSql('postgres', fields, {
        where: ['or', ['!=', ['field', 3], null], ['and', ['>', ['field', 4], 25]]],
      })
    ).toEqual(`SELECT * FROM data WHERE "date_joined" IS NOT NULL OR "age" > 25;`)
  })

  test('single nested or operand', () => {
    expect(
      generateSql('postgres', fields, {
        where: ['and', ['!=', ['field', 3], null], ['or', ['>', ['field', 4], 25]]],
      })
    ).toEqual(`SELECT * FROM data WHERE "date_joined" IS NOT NULL AND "age" > 25;`)
  })

  test('single and operand', () => {
    expect(
      generateSql('postgres', fields, {
        where: ['and', ['!=', ['field', 3], null]],
      })
    ).toEqual(`SELECT * FROM data WHERE "date_joined" IS NOT NULL;`)
  })

  test('single or operand', () => {
    expect(
      generateSql('postgres', fields, {
        where: ['or', ['!=', ['field', 3], null]],
      })
    ).toEqual(`SELECT * FROM data WHERE "date_joined" IS NOT NULL;`)
  })

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

  test('is-empty', () => {
    expect(
      generateSql('postgres', fields, {
        where: ['is-empty', ['field', 1]],
      })
    ).toEqual(`SELECT * FROM data WHERE "id" IS NULL;`)
  })

  test('not-empty', () => {
    expect(
      generateSql('postgres', fields, {
        where: ['not-empty', ['field', 1]],
      })
    ).toEqual(`SELECT * FROM data WHERE "id" IS NOT NULL;`)
  })

  test('postgres not', () => {
    const dialect = 'postgres'
    /**
     * @type {import('./index').Query}
     */
    const query = { limit: 20, where: ['not', ['=', ['field', 1], 'cam']] }
    const fields = { 1: 'name', 2: 'location' }

    expect(generateSql(dialect, fields, query)).toEqual(
      `SELECT * FROM data WHERE NOT "name" = 'cam' LIMIT 20;`
    )
  })

  test('postgres not with and', () => {
    const dialect = 'postgres'
    /**
     * @type {import('./index').Query}
     */
    const query = {
      limit: 20,
      where: ['not', ['and', ['=', ['field', 1], 'cam'], ['=', ['field', 2], 'Thailand']]],
    }
    const fields = { 1: 'name', 2: 'location' }

    expect(generateSql(dialect, fields, query)).toEqual(
      `SELECT * FROM data WHERE NOT ("name" = 'cam' AND "location" = 'Thailand') LIMIT 20;`
    )
  })
})

describe('Bonus points', () => {
  const fields = { 1: 'id', 2: 'name', 3: 'date_joined', 4: 'age' }

  test('flatten and with or', () => {
    expect(
      generateSql('postgres', fields, {
        where: [
          'and',
          ['!=', ['field', 3], null],
          ['or', ['>', ['field', 4], 25], ['=', ['field', 2], 'John']],
          ['and', ['>', ['field', 4], 25], ['=', ['field', 2], 'John']],
        ],
      })
    ).toEqual(
      `SELECT * FROM data WHERE "date_joined" IS NOT NULL AND ("age" > 25 OR "name" = 'John') AND "age" > 25 AND "name" = 'John';`
    )
  })

  test('flatten and', () => {
    expect(
      generateSql('postgres', fields, {
        where: [
          'and',
          ['!=', ['field', 3], null],
          [
            'and',
            ['>', ['field', 4], 25],
            ['and', ['=', ['field', 2], 'John'], ['=', ['field', 1], 999]],
          ],
        ],
      })
    ).toEqual(
      `SELECT * FROM data WHERE "date_joined" IS NOT NULL AND "age" > 25 AND "name" = 'John' AND "id" = 999;`
    )
  })

  test('flatten or', () => {
    expect(
      generateSql('postgres', fields, {
        where: [
          'or',
          ['!=', ['field', 3], null],
          ['or', ['>', ['field', 4], 25], ['=', ['field', 2], 'John']],
        ],
      })
    ).toEqual(
      `SELECT * FROM data WHERE "date_joined" IS NOT NULL OR "age" > 25 OR "name" = 'John';`
    )
  })

  test('cancel out not', () => {
    expect(
      generateSql('postgres', fields, {
        where: ['not', ['not', ['!=', ['field', 3], null]]],
      })
    ).toEqual(`SELECT * FROM data WHERE "date_joined" IS NOT NULL;`)
  })

  test('sqlserver optimize constant boolean is-empty true', () => {
    expect(generateSql('sqlserver', {}, { where: ['is-empty', null], limit: 10 })).toEqual(
      'SELECT TOP 10 * FROM data;'
    )
  })

  test('sqlserver optimize constant boolean is-empty false', () => {
    expect(generateSql('sqlserver', {}, { where: ['is-empty', 'value'], limit: 10 })).toEqual(
      'SELECT TOP 10 * FROM data WHERE false;'
    )
  })

  test('mysql optimize constant boolean not-empty true', () => {
    expect(generateSql('mysql', {}, { where: ['not-empty', 'value'], limit: 10 })).toEqual(
      'SELECT * FROM data LIMIT 10;'
    )
  })

  test('mysql optimize constant boolean not-empty false', () => {
    expect(generateSql('mysql', {}, { where: ['not-empty', null], limit: 10 })).toEqual(
      'SELECT * FROM data WHERE false LIMIT 10;'
    )
  })

  test('postgres optimize constant boolean = true', () => {
    expect(generateSql('postgres', {}, { where: ['=', 'value', 'value'], limit: 10 })).toEqual(
      'SELECT * FROM data LIMIT 10;'
    )
  })

  test('postgres optimize constant boolean = false', () => {
    expect(generateSql('postgres', {}, { where: ['=', 'value', 'another'], limit: 10 })).toEqual(
      'SELECT * FROM data WHERE false LIMIT 10;'
    )
  })

  test('postgres optimize constant boolean = both are null', () => {
    expect(generateSql('postgres', {}, { where: ['=', null, null], limit: 10 })).toEqual(
      'SELECT * FROM data LIMIT 10;'
    )
  })

  test('postgres optimize constant boolean != true', () => {
    expect(generateSql('postgres', {}, { where: ['!=', 'value', 1], limit: 10 })).toEqual(
      'SELECT * FROM data LIMIT 10;'
    )
  })

  test('postgres optimize constant boolean != false', () => {
    expect(generateSql('postgres', {}, { where: ['!=', 'value', 'value'], limit: 10 })).toEqual(
      'SELECT * FROM data WHERE false LIMIT 10;'
    )
  })

  test('postgres optimize constant boolean > true', () => {
    expect(generateSql('postgres', {}, { where: ['>', 2, 1], limit: 10 })).toEqual(
      'SELECT * FROM data LIMIT 10;'
    )
  })

  test('postgres optimize constant boolean > false', () => {
    expect(generateSql('postgres', {}, { where: ['>', 'a', 'b'], limit: 10 })).toEqual(
      'SELECT * FROM data WHERE false LIMIT 10;'
    )
  })

  test('postgres optimize constant boolean < true', () => {
    expect(generateSql('postgres', {}, { where: ['<', 'a', 'b'], limit: 10 })).toEqual(
      'SELECT * FROM data LIMIT 10;'
    )
  })

  test('postgres optimize constant boolean < false', () => {
    expect(generateSql('postgres', {}, { where: ['<', 2, 1], limit: 10 })).toEqual(
      'SELECT * FROM data WHERE false LIMIT 10;'
    )
  })

  test('postgres optimize constant boolean not true', () => {
    expect(generateSql('postgres', {}, { where: ['not', ['<', 2, 1]], limit: 10 })).toEqual(
      'SELECT * FROM data LIMIT 10;'
    )
  })

  test('postgres optimize constant boolean not false', () => {
    expect(generateSql('postgres', {}, { where: ['not', ['<', 'a', 'b']], limit: 10 })).toEqual(
      'SELECT * FROM data WHERE false LIMIT 10;'
    )
  })

  test('postgres and false', () => {
    const fields = { 1: 'id' }
    expect(
      generateSql('postgres', fields, {
        where: ['and', ['=', ['field', 1], 999], ['>', 'a', 'b']],
        limit: 10,
      })
    ).toEqual('SELECT * FROM data WHERE false LIMIT 10;')

    expect(
      generateSql('postgres', fields, {
        where: ['and', ['>', 'a', 'b'], ['=', ['field', 1], 999]],
        limit: 10,
      })
    ).toEqual('SELECT * FROM data WHERE false LIMIT 10;')
  })

  test('postgres and true', () => {
    const fields = { 1: 'id' }
    expect(
      generateSql('postgres', fields, {
        where: ['and', ['=', ['field', 1], 999], ['<', 'a', 'b']],
        limit: 10,
      })
    ).toEqual('SELECT * FROM data WHERE "id" = 999 LIMIT 10;')

    expect(
      generateSql('postgres', fields, {
        where: ['and', ['<', 'a', 'b'], ['=', ['field', 1], 999]],
        limit: 10,
      })
    ).toEqual('SELECT * FROM data WHERE "id" = 999 LIMIT 10;')
  })

  test('postgres or true', () => {
    const fields = { 1: 'id' }
    expect(
      generateSql('postgres', fields, {
        where: ['or', ['=', ['field', 1], 999], ['<', 'a', 'b']],
        limit: 10,
      })
    ).toEqual('SELECT * FROM data LIMIT 10;')

    expect(
      generateSql('postgres', fields, {
        where: ['or', ['<', 'a', 'b'], ['=', ['field', 1], 999]],
        limit: 10,
      })
    ).toEqual('SELECT * FROM data LIMIT 10;')
  })

  test('postgres or false', () => {
    const fields = { 1: 'id' }
    expect(
      generateSql('postgres', fields, {
        where: ['or', ['=', ['field', 1], 999], ['=', ['field', 1], 888], ['>', 1, 2]],
        limit: 10,
      })
    ).toEqual('SELECT * FROM data WHERE "id" = 999 OR "id" = 888 LIMIT 10;')

    expect(
      generateSql('postgres', fields, {
        where: ['or', ['>', 1, 2], ['=', ['field', 1], 888], ['=', ['field', 1], 999]],
        limit: 10,
      })
    ).toEqual('SELECT * FROM data WHERE "id" = 888 OR "id" = 999 LIMIT 10;')
  })
})

describe('macro', () => {
  test('simple macro', () => {
    /** @type {import('./index').Macros} */
    const macros = { is_joe: ['=', ['field', 2], 'joe'] }
    expect(
      generateSql(
        'postgres',
        { 1: 'id', 2: 'name' },
        {
          where: ['and', ['<', ['field', 1], 5], ['macro', 'is_joe']],
        },
        macros
      )
    ).toEqual(`SELECT * FROM data WHERE "id" < 5 AND "name" = 'joe';`)
  })

  test('nested macros', () => {
    /** @type {import('./index').Macros} */
    const macros = {
      is_joe: ['=', ['field', 2], 'joe'],
      is_adult: ['>', ['field', 4], 18],
      is_old_joe: ['and', ['macro', 'is_joe'], ['macro', 'is_adult']],
    }

    const fields = { 1: 'id', 2: 'name', 3: 'date_joined', 4: 'age' }
    expect(
      generateSql(
        'postgres',
        fields,
        {
          where: ['and', ['<', ['field', 1], 5], ['macro', 'is_old_joe']],
        },
        macros
      )
    ).toEqual(`SELECT * FROM data WHERE "id" < 5 AND "name" = 'joe' AND "age" > 18;`)
  })

  test('circular macros', () => {
    /** @type {import('./index').Macros} */
    const macros = {
      is_good: ['and', ['macro', 'is_decent'], ['>', ['field', 4], 18]],
      is_decent: ['and', ['macro', 'is_good'], ['<', ['field', 5], 5]],
    }

    const fields = { 1: 'id', 2: 'name', 3: 'date_joined', 4: 'age' }
    expect(() => {
      generateSql(
        'postgres',
        fields,
        {
          where: ['and', ['<', ['field', 1], 5], ['macro', 'is_old_joe']],
        },
        macros
      )
    }).toThrowError('Circular macros found.')
  })
})

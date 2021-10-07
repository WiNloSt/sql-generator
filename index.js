/**
 * @typedef {'postgresql'|'mysql'|'sqlserver'} Dialect
 *
 * @typedef {{[key: number]: string}} Fields
 *
 *
 * @typedef Query
 * @property {number|null} limit
 * @property {Where|null} where
 *
 * @typedef {[Operator, ...any[]]} Where
 *
 * @typedef {'and'|'or'|'not'|'<'|'>'|'='|'!='|'is-empty'|'not-empty'} Operator
 */

/**
 *
 * @param {Dialect} dialect
 * @param {Fields} fields
 * @param {Query} query
 * @returns any
 */
module.exports = function generateSql(dialect, fields, query) {
  const { limit } = query
  if (dialect === 'sqlserver') {
    const limitClause = limit ? `TOP ${limit} ` : ''
    return `SELECT * ${limitClause}FROM data;`
  }

  // `mysql` and `postgresql`
  const limitClause = limit ? ` LIMIT ${limit}` : ''
  return `SELECT * FROM data${limitClause};`
}

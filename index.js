/**
 * @typedef {'postgresql'|'mysql'|'sqlserver'} Dialect
 *
 * @typedef {{[key: number]: string}} Fields
 *
 *
 * @typedef Query
 * @property {number|null} limit
 * @property {Node|null} where
 *
 * @typedef {[Operator, ...any[]]} Node
 *
 * @typedef {string|number} Value
 *
 * @typedef {Node|Value} NodeChild
 *
 * @typedef {'and'|'or'|'not'|'<'|'>'|'='|'!='|'is-empty'|'not-empty'} Operator
 *
 * @typedef {Operator|'field'} NodeType
 */

/**
 *
 * @param {Dialect} dialect
 * @param {Fields} fields
 * @param {Query} query
 * @returns any
 */
module.exports = function generateSql(dialect, fields, query) {
  const limitClause = createLimitClause(dialect, query.limit)
  const whereClause = createWhereClause(dialect, query.where, fields)
  if (dialect === 'sqlserver') {
    return `SELECT * ${limitClause}FROM data${whereClause};`
  }

  // `mysql` and `postgresql`
  return `SELECT * FROM data${whereClause}${limitClause};`
}

/**
 *
 * @param {Dialect} dialect
 * @param {number|null} limit
 */
function createLimitClause(dialect, limit) {
  if (!limit) {
    return ''
  }

  if (dialect === 'sqlserver') {
    return `TOP ${limit} `
  }

  // `mysql` and `postgresql`
  return ` LIMIT ${limit}`
}

/**
 *
 * @param {Dialect} dialect
 * @param {Node|null} where
 * @param {Fields} fields
 */
function createWhereClause(dialect, where, fields) {
  if (!where) {
    return ''
  }
  const context = {
    dialect,
    fields,
  }
  const traverse = createTraverse(context)
  const codeGenerationVisitors = createCodeGenerationVisitors(dialect, context)

  return ` WHERE ${traverse(where, codeGenerationVisitors)}`
}

/**
 * @typedef {{[key in NodeType]: Visitor}} Visitors
 */

/**
 * @typedef {(results: any[], nodeChildren?: NodeChild[]) => any} Visitor
 */

/**
 * @typedef TraverserContext
 * @property {Dialect} dialect
 * @property {Fields} fields
 */

/**
 *
 * @param {TraverserContext} context
 */
function createTraverse(context) {
  /**
   * @callback Traverser post order tree traversal using DFS
   * @param {Node} where
   * @param {Visitors} visitors
   * @returns any
   */
  return /** @type {Traverser} */ function traverse(node, visitors) {
    if (!isNode(node)) {
      return normalizeValue(node)
    }

    const [nodeType, ...children] = node
    const transformedChildren = children.map((child) => {
      return traverse(child, visitors)
    })

    return visitors[nodeType](transformedChildren, children)
  }
}

/**
 * @param {Value} value
 */
function normalizeValue(value) {
  if (typeof value === 'string') {
    return `'${value}'`
  }

  return value
}
/**
 *
 * @param {any} node
 * @returns {boolean}
 */
function isNode(node) {
  return Array.isArray(node)
}

/**
 *
 * @param {Dialect} dialect
 * @param {TraverserContext} context
 * @return {Visitors}
 */
function createCodeGenerationVisitors(dialect, context) {
  return {
    and: () => '',
    or: () => '',
    not: () => '',
    '<': () => '',
    '>': () => '',
    '=': (results, nodeChildren) => {
      if (nodeChildren) {
        const [leftResult, rightResult] = results
        return `${leftResult} = ${rightResult}`
      }
    },
    '!=': () => '',
    'is-empty': () => '',
    'not-empty': () => '',
    field: (_, nodeChildren) => {
      if (nodeChildren) {
        /** @type {number} */
        // @ts-ignore force type
        const fieldId = nodeChildren[0]
        return context.fields[fieldId]
      }
    },
  }
}

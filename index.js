/**
 * @typedef {'postgres'|'mysql'|'sqlserver'} Dialect
 *
 * @typedef {{[key: number]: string}} Fields
 *
 *
 * @typedef Query
 * @property {number|null} [limit]
 * @property {Node|null} [where]
 *
 * @typedef {[Operator, ...any[]]} Node
 *
 * @typedef {string|number|'nil'} Value
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
    return `SELECT ${limitClause}* FROM data${whereClause};`
  }

  // `mysql` and `postgresql`
  return `SELECT * FROM data${whereClause}${limitClause};`
}

/**
 *
 * @param {Dialect} dialect
 * @param {number|null|undefined} limit
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
 * @param {Node|null|undefined} where
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
  const transformationVisitors = createTransformationVisitors(dialect, context)
  const transformedWhere = traverse(where, transformationVisitors)

  const codeGenerationVisitors = createCodeGenerationVisitors(dialect, context)
  return ` WHERE ${traverse(transformedWhere, codeGenerationVisitors)}`
}

/**
 * @typedef {{[key in NodeType]?: Visitor} & {value: ValueVisitor}} Visitors
 *
 * @typedef {(results: any[], nodeChildren?: NodeChild[]) => any} Visitor
 *
 * @typedef {(value: Value) => any} ValueVisitor
 *
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
      // @ts-ignore
      return visitors.value(node)
    }

    const [nodeType, ...children] = node
    const transformedChildren = children.map((child) => {
      return traverse(child, visitors)
    })

    return getVisitor(nodeType, visitors)(transformedChildren, children)
  }
}

/**
 * @param {Operator} nodeType
 * @param {Visitors} visitors
 * @returns {Visitor}
 */
function getVisitor(nodeType, visitors) {
  /**
   * @param {any} results
   */
  function defaultVisitor(results) {
    return [nodeType, ...results]
  }

  return visitors[nodeType] || defaultVisitor
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
    and: (results, nodeChildren) => {
      // 1 child
      // 2 or more child
      if (nodeChildren) {
        return results
          .map((result, index) => {
            const nodeChild = nodeChildren[index]
            if (isNode(nodeChild)) {
              /** @type {Node} */
              // @ts-ignore force type casting
              const node = nodeChild
              const nodeType = node[0]
              if (nodeType === 'or') {
                return `(${result})`
              }
            }

            return result
          })
          .join(' AND ')
      }
    },
    or: (results, nodeChildren) => {
      // 1 child
      // 2 or more child
      if (nodeChildren) {
        return results
          .map((result, index) => {
            const nodeChild = nodeChildren[index]
            if (isNode(nodeChild)) {
              /** @type {Node} */
              // @ts-ignore force type casting
              const node = nodeChild
              const nodeType = node[0]
              if (nodeType === 'and') {
                return `(${result})`
              }
            }

            return result
          })
          .join(' OR ')
      }
    },
    not: () => '',
    '<': (results) => {
      const [leftResult, rightResult] = results

      return `${leftResult} < ${rightResult}`
    },
    '>': (results) => {
      const [leftResult, rightResult] = results

      return `${leftResult} > ${rightResult}`
    },
    '=': (results, nodeChildren) => {
      if (nodeChildren) {
        const hasOneOperand = results.length === 2
        if (hasOneOperand) {
          const [leftResult, rightResult] = results

          /**
           * @param {NodeChild} rightChild
           */
          function createOperand(rightChild) {
            if (rightChild === 'nil') {
              return 'IS'
            }

            return '='
          }
          return `${leftResult} ${createOperand(nodeChildren[1])} ${rightResult}`
        }

        const [leftResult, ...restResults] = results

        return `${leftResult} IN (${restResults.join(', ')})`
      }
    },
    '!=': (results, nodeChildren) => {
      if (nodeChildren) {
        const hasOneOperand = results.length === 2
        if (hasOneOperand) {
          const [leftResult, rightResult] = results

          /**
           * @param {NodeChild} rightChild
           */
          function createOperand(rightChild) {
            if (rightChild === 'nil') {
              return 'IS NOT'
            }

            return '!='
          }
          return `${leftResult} ${createOperand(nodeChildren[1])} ${rightResult}`
        }

        const [leftResult, ...restResults] = results

        return `${leftResult} NOT IN (${restResults.join(', ')})`
      }
    },
    'is-empty': () => '',
    'not-empty': () => '',
    field: (_, nodeChildren) => {
      if (nodeChildren) {
        /** @type {number} */
        // @ts-ignore force type
        const fieldId = nodeChildren[0]
        const quoteCharacter = createQuoteCharacter(dialect)

        /**
         * @param {Dialect} dialect
         */
        function createQuoteCharacter(dialect) {
          if (dialect === 'mysql') {
            return '`'
          }

          // `postgres` and `sqlserver`
          return '"'
        }
        return quoteCharacter + context.fields[fieldId] + quoteCharacter
      }
    },
    value(value) {
      if (value === 'nil') {
        return 'NULL'
      }
      if (typeof value === 'string') {
        return `'${value}'`
      }

      return value
    },
  }
}

/**
 *
 * @param {Dialect} dialect
 * @param {TraverserContext} context
 * @return {Visitors}
 */
function createTransformationVisitors(dialect, context) {
  return {
    and(results) {
      const shouldFlattenNode = results.length === 1
      if (shouldFlattenNode) {
        return results[0]
      }

      return ['and', ...results]
    },
    value(value) {
      return value
    },
  }
}

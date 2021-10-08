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
 * @typedef {[NodeType, ...any[]]} Node
 *
 * @typedef {string|number|null} Value
 *
 * @typedef {Node} NodeChild
 *
 * @typedef {'and'|'or'|'not'|'<'|'>'|'='|'!='|'is-empty'|'not-empty'} Operator
 *
 * @typedef {Operator|'field'|'macro'} NodeType
 *
 * @typedef {{[macro: string]: Node}} Macros
 */

/**
 *
 * @param {Dialect} dialect
 * @param {Fields} fields
 * @param {Query} query
 * @param {Macros} [macros]
 * @returns any
 */
module.exports = function generateSql(dialect, fields, query, macros) {
  const limitClause = createLimitClause(dialect, query.limit)
  const whereClause = createWhereClause(dialect, query.where, fields, macros)
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
 * @param {Macros} [macros]
 */
function createWhereClause(dialect, where, fields, macros) {
  if (!where) {
    return ''
  }
  const context = {
    dialect,
    fields,
    macros,
  }
  const traverse = createTraverse(context)

  if (macros) {
    /** @type {Node} */
    const whereWithMacros = traverse(where, createMacroVisitors(normalizeMacros(macros)))
    where = whereWithMacros
  }
  const transformationVisitors = createTransformationVisitors(dialect, context)
  const transformedWhere = traverse(where, transformationVisitors)

  const codeGenerationVisitors = createCodeGenerationVisitors(dialect, context)
  const whereClause = traverse(transformedWhere, codeGenerationVisitors)
  if (whereClause === true) {
    return ''
  }
  return ` WHERE ${whereClause}`
}
/**
 * @param {Macros} macros
 * @returns {Macros}
 */
function normalizeMacros(macros) {
  const traverseMacro = createTraverseMacro(macros)
  const normalizedMacro = Object.entries(macros)
    .map(([macroKey, node]) => {
      const traversedMacro = traverseMacro(node)
      /** @type {[string, Node]} */
      const returnValue = [macroKey, traversedMacro]
      return returnValue
    })
    .reduce((macros, [macroKey, node]) => {
      return {
        ...macros,
        [macroKey]: node,
      }
    }, {})
  return normalizedMacro
}

/**
 * @param {Macros} macros
 */
function createTraverseMacro(macros) {
  const macroVisitors = createMacroVisitors(macros)
  /**
   * @param {Node} node
   * @param {Visitors} macroVisitors
   * @param {number} [depth] used to detect circular macros
   * @returns {any}
   */
  return function traverseMacro(node, macroDepth = 0) {
    // // check circular macros
    if (macroDepth > Object.keys(macros).length) {
      throw Error('Circular macros found.')
    }

    if (!isNode(node)) {
      return node
    }

    const [nodeType, ...children] = node

    const traversedChildren = children.map((child) => {
      const visitedChild = getVisitor(nodeType, macroVisitors)([child])

      // This is a hack because visitor is for post order traversal but we use it in a preorder traversal
      if (nodeType === 'macro') {
        return traverseMacro(visitedChild, macroDepth + 1)
      }

      return traverseMacro(visitedChild[1], macroDepth)
    })

    // This is a hack because visitor is for post order traversal but we use it in a preorder traversal
    if (nodeType === 'macro') {
      return traversedChildren[0]
    }

    return [nodeType, ...traversedChildren]
  }
}
/**
 * @param {Macros | undefined} macros
 * @returns {Visitors}
 */
function createMacroVisitors(macros) {
  return {
    macro(results) {
      if (macros) {
        const macroName = results[0]
        return macros[macroName]
      }
    },
    // This is not actually needed because it's not used in the macro traverser
    // but I kept it here because I don't wanna fix the type.
    value(value) {
      return value
    },
    default(nodeType, results) {
      return [nodeType, ...results]
    },
  }
}

/**
 * @typedef {{[key in NodeType]?: Visitor} & {value: ValueVisitor, default: (nodeType: NodeType, results: any) => any}} Visitors
 *
 * @typedef {(results: any[], nodeChildren?: NodeChild[]) => any} Visitor
 *
 * @typedef {(value: Value) => any} ValueVisitor
 *
 * @typedef TraverserContext
 * @property {Dialect} dialect
 * @property {Fields} fields
 * @property {Macros} [macros]
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
   * @returns {any}
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
 * @param {NodeType} nodeType
 * @param {Visitors} visitors
 * @returns {Visitor}
 */
function getVisitor(nodeType, visitors) {
  return visitors[nodeType] || ((results) => visitors.default(nodeType, results))
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
      // 1 child is already handled in AST transformer
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
      // 1 child is already handled in AST transformer
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
    not: (results, nodeChildren) => {
      if (nodeChildren) {
        const isClause = ['and', 'or'].includes(nodeChildren[0][0])
        if (isClause) {
          return `NOT (${results})`
        }
      }
      return `NOT ${results}`
    },
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
            if (rightChild === null) {
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
            if (rightChild === null) {
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
    // Implement in AST transformer
    // 'is-empty': () => '',
    // Implement in AST transformer
    // 'not-empty': () => '',
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
    default(_, results) {
      return results
    },
    value(value) {
      if (value === null) {
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
  /** @type {Visitors} */
  const visitors = {
    and(results) {
      const shouldFlattenNode = results.length === 1
      if (shouldFlattenNode) {
        return results[0]
      }

      const canShortCircuit = results.some((node) => {
        return node === false
      })
      if (canShortCircuit) {
        return false
      }

      return ['and', ...results.filter((node) => node !== true)]
    },
    or(results) {
      const shouldFlattenNode = results.length === 1
      if (shouldFlattenNode) {
        return results[0]
      }

      const canShortCircuit = results.some((node) => {
        return node === true
      })
      if (canShortCircuit) {
        return true
      }

      return ['or', ...results.filter((node) => node !== false)]
    },
    not(results) {
      const node = results[0]
      if (!isNode(node)) {
        return !node
      }

      const [nodeType, child] = node
      if (nodeType === 'not') {
        return child
      }

      return ['not', node]
    },
    '>': function (results) {
      const [leftNode, rightNode] = results
      if (!isNode(leftNode) && !isNode(rightNode)) {
        return leftNode > rightNode
      }

      return ['>', ...results]
    },
    '<': function (results) {
      const [leftNode, rightNode] = results
      if (!isNode(leftNode) && !isNode(rightNode)) {
        return leftNode < rightNode
      }

      return ['<', ...results]
    },
    '=': function (results) {
      const [leftNode, rightNode] = results
      if (!isNode(leftNode) && !isNode(rightNode)) {
        return leftNode === rightNode
      }

      return ['=', ...results]
    },
    '!=': (results) => {
      const [leftNode, rightNode] = results
      if (!isNode(leftNode) && !isNode(rightNode)) {
        return leftNode !== rightNode
      }

      return ['!=', ...results]
    },
    'is-empty': (results) => {
      const node = results[0]
      if (isNode(node)) {
        return ['=', node, null]
      }

      return node === null
    },
    'not-empty': (results) => {
      const node = results[0]
      if (isNode(node)) {
        return ['!=', node, null]
      }

      return node !== null
    },
    value(value) {
      return value
    },
    default(nodeType, results) {
      return [nodeType, results]
    },
  }
  return visitors
}

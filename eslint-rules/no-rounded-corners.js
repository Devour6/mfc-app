/**
 * ESLint rule: no-rounded-corners
 *
 * Disallows Tailwind `rounded` classes and inline `borderRadius` styles.
 * MFC uses sharp corners exclusively (pixel-art brand requirement).
 */

// Matches: rounded, rounded-sm, rounded-md, rounded-lg, rounded-xl, rounded-2xl,
// rounded-3xl, rounded-full, rounded-t-*, rounded-b-*, rounded-l-*, rounded-r-*,
// rounded-tl-*, rounded-tr-*, rounded-bl-*, rounded-br-*, rounded-s-*, rounded-e-*,
// rounded-ss-*, rounded-se-*, rounded-es-*, rounded-ee-*
const ROUNDED_REGEX = /\brounded(?:-(?:sm|md|lg|xl|2xl|3xl|full|none|t|b|l|r|tl|tr|bl|br|s|e|ss|se|es|ee)(?:-(?:sm|md|lg|xl|2xl|3xl|full|none))?)?(?=\s|"|'|`|$)/;

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow border-radius (rounded corners) — MFC pixel-art brand requirement',
    },
    messages: {
      noRoundedClass: 'No rounded corners allowed. MFC uses sharp corners exclusively. Remove "{{match}}" from className.',
      noBorderRadius: 'No border-radius allowed. MFC uses sharp corners exclusively. Remove borderRadius style.',
    },
    schema: [],
  },

  create(context) {
    // Only enforce in component and app files
    const filename = context.getFilename();
    if (!filename.match(/\.(tsx|jsx)$/)) return {};

    return {
      // Check className string literals: className="... rounded-lg ..."
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;

        const value = node.value;
        if (!value) return;

        // className="string"
        if (value.type === 'Literal' && typeof value.value === 'string') {
          checkString(context, value, value.value);
        }

        // className={`template`} or className={expression}
        if (value.type === 'JSXExpressionContainer') {
          checkExpression(context, value.expression);
        }
      },

      // Check inline style={{ borderRadius: ... }}
      Property(node) {
        if (
          node.key &&
          ((node.key.type === 'Identifier' && node.key.name === 'borderRadius') ||
           (node.key.type === 'Literal' && node.key.value === 'borderRadius') ||
           (node.key.type === 'Literal' && node.key.value === 'border-radius'))
        ) {
          context.report({
            node,
            messageId: 'noBorderRadius',
          });
        }
      },
    };

    function checkString(context, node, str) {
      const match = str.match(ROUNDED_REGEX);
      if (match) {
        context.report({
          node,
          messageId: 'noRoundedClass',
          data: { match: match[0] },
        });
      }
    }

    function checkExpression(context, node) {
      if (!node) return;

      // Template literal: `px-4 rounded-lg ${...}`
      if (node.type === 'TemplateLiteral') {
        for (const quasi of node.quasis) {
          checkString(context, quasi, quasi.value.raw);
        }
        for (const expr of node.expressions) {
          checkExpression(context, expr);
        }
      }

      // String literal in expression: {"px-4 rounded-lg"}
      if (node.type === 'Literal' && typeof node.value === 'string') {
        checkString(context, node, node.value);
      }

      // Conditional: condition ? "rounded-lg" : "rounded-sm"
      if (node.type === 'ConditionalExpression') {
        checkExpression(context, node.consequent);
        checkExpression(context, node.alternate);
      }

      // Binary concat: "px-4 " + "rounded-lg"
      if (node.type === 'BinaryExpression' && node.operator === '+') {
        checkExpression(context, node.left);
        checkExpression(context, node.right);
      }

      // Function call: clsx("rounded-lg", ...) or cn("rounded-lg", ...)
      if (node.type === 'CallExpression') {
        for (const arg of node.arguments) {
          checkExpression(context, arg);
        }
      }
    }
  },
};

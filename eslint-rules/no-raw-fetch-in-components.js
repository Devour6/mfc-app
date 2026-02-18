/**
 * ESLint rule: no-raw-fetch-in-components
 *
 * Disallows direct fetch() calls in component files.
 * All API calls in components should go through lib/api-client.ts.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw fetch() in component files — use lib/api-client.ts instead',
    },
    messages: {
      noRawFetch: 'Do not use fetch() directly in components. Import from lib/api-client.ts instead.',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // Only enforce in components/ directory
    if (!filename.includes('/components/')) return {};

    return {
      CallExpression(node) {
        // Match: fetch(...) — global fetch call
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'fetch'
        ) {
          context.report({
            node,
            messageId: 'noRawFetch',
          });
        }

        // Match: window.fetch(...)
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'window' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'fetch'
        ) {
          context.report({
            node,
            messageId: 'noRawFetch',
          });
        }

        // Match: globalThis.fetch(...)
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'globalThis' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'fetch'
        ) {
          context.report({
            node,
            messageId: 'noRawFetch',
          });
        }
      },
    };
  },
};

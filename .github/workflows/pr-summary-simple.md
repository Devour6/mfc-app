---
on:
  pull_request:
    types: [opened]

permissions:
  contents: read

safe-outputs:
  add-comment:
    max: 1

engine: copilot
---

# Simple PR Summary

When a pull request is opened, analyze the changes and provide a helpful summary comment for reviewers.

## Instructions

1. **Read the Pull Request**:
   - Examine the PR title and description
   - Review the code diff to understand what files were changed
   - Identify the scope and nature of the changes

2. **Analyze the Changes**:
   - Determine the main purpose (bug fix, feature, refactor, etc.)
   - Note any significant modifications or additions
   - Check for any potential breaking changes
   - Identify if new dependencies were added

3. **Create Summary Comment**:
   - Write a concise summary of the changes
   - Use bullet points for multiple modifications
   - Highlight important changes or considerations
   - Keep the tone professional and helpful

## Style Guidelines

- Start with a brief overview of the PR's purpose
- Use clear, technical language appropriate for developers
- Include specific file names or components when relevant
- Use emoji sparingly for visual clarity (✨ for features, 🐛 for fixes)
- End with any recommendations for review focus

## Example Output Format

```
## PR Summary

This pull request [brief description of main purpose].

### Key Changes:
• [Change 1 with file/component reference]
• [Change 2 with file/component reference]  
• [Change 3 with file/component reference]

### Review Focus:
• [Specific area to pay attention to]
• [Any testing considerations]

*This summary was generated automatically by the PR Summary workflow.*
```
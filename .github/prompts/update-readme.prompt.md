---
mode: 'agent'
tools: ['codebase', 'file', 'insert_edit_into_file']
name: 'Update README.md In-Place'
description: 'Review and update README.md to accurately reflect current project features, setup, and usage, applying all changes in-place.'
---

**Goal:**
Ensure #file:../../README.md provides accurate, clear, and up-to-date information for users and developers. All revisions MUST be applied directly to the file.

**Instructions:**

1.  **Read and Analyze:**
    *   Thoroughly read #file:../../README.md
    *   Analyze the #codebase for current features, installation procedures, usage examples, and available tools.

2.  **Identify and Revise (Apply IN-PLACE using `insert_edit_into_file`):**
    *   **Features & Tools:** Verify that the "Overview," "MCP Tools," and any feature list sections accurately describe all functionalities available in the current #codebase. Add missing tools/features or remove obsolete ones.
    *   **Installation & Setup:** Ensure that "Installation," "Development," and any setup instructions are correct, complete, and tested against the current project structure and dependencies.
    *   **Usage Examples:** Check that all usage examples (command-line, environment variables, API explorer) are accurate and functional.
    *   **Outdated Information:** Update any outdated project background, links, or references.
    *   **Clarity and Completeness:** Improve clarity and add any missing information that would be helpful for a new user or developer.

**Output Requirements:**
*   ALL revisions MUST be made using the `insert_edit_into_file` tool. Provide a clear explanation for each edit.
*   If, after review, no changes are needed for `README.md`, explicitly state this.
*   Maintain the existing style and tone of the document.
*   Ensure that the README is user-friendly and provides a good first impression of the project.

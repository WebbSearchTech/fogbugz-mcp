---
mode: 'agent'
tools: ['githubRepo', 'file', 'insert_edit_into_file']
name: 'Update Docs from GitHub Feedback In-Place'
description: 'Retrieves GitHub issues and discussions, identifies documentation improvement opportunities, and applies changes in-place to DESIGN-DOCUMENT.md, DEVELOPMENT-PLAN.md, or README.md.'
---

**Goal:**
To improve `DESIGN-DOCUMENT.md`, `DEVELOPMENT-PLAN.md`, and `README.md` by incorporating feedback and addressing points of confusion identified in the project's GitHub issues and discussions. All revisions MUST be applied directly to the relevant files.

**Repository:** `WebbSearchTech/fogbugz-mcp` (Replace this with the actual repository owner and name)

**Instructions:**

1.  **Fetch GitHub Issues and Discussions:**
    *   Use the `githubRepo` tool to search the specified repository.
    *   Focus on queries that are likely to reveal documentation needs. Suggestions:
        *   Open issues with labels like 'documentation', 'bug', 'enhancement', 'question'.
        *   Recent discussions.
        *   Search terms like "confusing," "clarify," "how to," "documentation," "understand," "missing info."
    *   Retrieve a reasonable number of recent and relevant items for analysis.

2.  **Analyze Issues and Discussions for Documentation Impact:**
    *   For each retrieved item, determine if it:
        *   **Directly suggests a documentation update** (e.g., "The README is missing X," "Could you add Y to the design doc?").
        *   **Indirectly indicates a need for documentation improvement.** This includes:
            *   User confusion about a feature that clear documentation could resolve.
            *   Questions about setup, usage, or architecture that should be covered in the docs.
            *   Bug reports stemming from misunderstandings of how a feature is intended to work, where docs could clarify.
            *   Feature requests that might imply current features aren't well understood or documented.

3.  **Identify the Appropriate Document and Formulate Changes:**
    *   For each item identified in Step 2, decide which document is the most appropriate target for the improvement:
        *   `DESIGN-DOCUMENT.md`: For clarifications on architecture, core design principles, API integration details, or high-level system behavior.
        *   `DEVELOPMENT-PLAN.md`: For updates related to planned features, addressing misunderstandings about project scope, or clarifying the status of development items if the confusion relates to what is or isn't implemented.
        *   `README.md`: For user-facing information, setup instructions, tool usage, troubleshooting common points of confusion, or clarifying feature overviews.
    *   Draft the specific text to be added, removed, or modified in the chosen document. Ensure the change directly addresses the issue or confusion.

4.  **Apply Revisions (IN-PLACE using `insert_edit_into_file`):**
    *   For each formulated change, use the `insert_edit_into_file` tool to update the target document (`DESIGN-DOCUMENT.md`, `DEVELOPMENT-PLAN.md`, or `README.md`).
    *   Provide a clear `explanation` for each edit when calling the tool, referencing the GitHub issue/discussion number if applicable (e.g., "Clarify resource caching based on feedback in issue #123").
    *   Group changes for the same file if possible, but prioritize clarity and accuracy for each distinct piece of feedback.

**Output Requirements:**
*   ALL revisions MUST be made using the `insert_edit_into_file` tool.
*   Do not list changes or diffs in the chat. The file edits applied by the tool are the primary output.
*   If, after reviewing the GitHub feedback, no actionable documentation changes are identified for a specific document (or overall), explicitly state this.
*   Maintain the existing style, tone, and structure of each document when making revisions.
*   If multiple issues point to the same documentation gap, consolidate the feedback into a single, comprehensive update.

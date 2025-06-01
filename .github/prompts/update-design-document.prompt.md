---
mode: 'agent'
tools: ['codebase', 'file', 'insert_edit_into_file']
name: 'Update DESIGN-DOCUMENT.md In-Place'
description: 'Review and update DESIGN-DOCUMENT.md to align with the current codebase, applying all changes in-place.'
---

**Goal:**
Ensure #file:../../DESIGN-DOCUMENT.md is accurate and reflects the current project design and implementation. All revisions MUST be applied directly to the file.

**Instructions:**

1.  **Read and Analyze:**
    *   Thoroughly read #file:../../DESIGN-DOCUMENT.md
    *   Analyze the #codebase, paying close attention to major architectural components, API integrations, data handling (especially related to `resources.ts`), and overall system flow.

2.  **Identify and Revise (Apply IN-PLACE using `insert_edit_into_file`):**
    *   **Outdated/Incorrect Information:** Identify any design aspects, features, or plans described in the document that are no longer accurate, not implemented as described, or have been superseded by changes in the #codebase. Revise or remove these sections.
    *   **Missing Information:** Identify any significant design elements, architectural patterns (e.g., how dynamic resources from `resources.ts` are managed and used), or key functionalities implemented in the #codebase that are not adequately documented in `DESIGN-DOCUMENT.md`. Add new sections or update existing ones to cover these.
    *   **Consistency:** Ensure all descriptions of API usage, authentication, endpoints, and tool interactions are accurate and consistent with the current implementation.

**Output Requirements:**
*   ALL revisions MUST be made using the `insert_edit_into_file` tool. Provide a clear explanation for each edit when calling the tool.
*   If, after review, no changes are needed for `DESIGN-DOCUMENT.md`, explicitly state this.
*   Maintain the existing style and tone of the document.

---
mode: 'agent'
tools: ['codebase', 'file', 'insert_edit_into_file']
name: 'Update DEVELOPMENT-PLAN.md In-Place'
description: 'Review and update DEVELOPMENT-PLAN.md to align with current project status and codebase, applying all changes in-place, especially the "Next Steps" section.'
---

**Goal:**
Ensure #file:../../DEVELOPMENT-PLAN.md accurately reflects the project's development plan, completed tasks, and actionable next steps. All revisions MUST be applied directly to the file.

**Instructions:**

1.  **Read and Analyze:**
    *   Thoroughly read #file:../../DEVELOPMENT-PLAN.md
    *   Analyze the #codebase to understand the current implementation status of planned features and tasks.

2.  **Identify and Revise (Apply IN-PLACE using `insert_edit_into_file`):**
    *   **Task Status:** Update the status of tasks in the "Detailed Action Plan" or any similar sections. Mark tasks as "Completed," "In Progress," "Blocked," or "Not Started" based on the #codebase.
    *   **Relevance:** Identify any planned tasks or features that are no longer relevant, have been significantly altered, or were implemented differently. Update or remove these as appropriate.
    *   **Missing Tasks/Features:** Identify any significant work items or features implemented in the #codebase that were not part of the original plan. Add them to the plan or relevant sections.
    *   **Alignment:** Ensure sections like "Functional Requirements" and "Architecture & Technology Stack" are consistent with the current state and include considerations for `resources.ts` if applicable.
    *   **"Next Steps" Section:** Critically review and rewrite the "Next Steps" section to provide a clear, concise, and actionable list of priorities based on the current project status and remaining goals.

**Output Requirements:**
*   ALL revisions MUST be made using the `insert_edit_into_file` tool. Provide a clear explanation for each edit.
*   The "Next Steps" section, in particular, should be thoroughly updated.
*   If other sections require no changes, you can state that, but "Next Steps" must be addressed.
*   Maintain the existing style and tone of the document.

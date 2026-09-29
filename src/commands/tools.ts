/**
 * MCP Tool definitions for FogBugz operations
 */

// Import `resources` to resolve its usage
import { resources } from '../resources';

// Update the `Tool` interface to allow specific input types for `execute`
interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  execute?: (input: any) => Promise<void>;
}

// Tool: Create a new FogBugz case
export const createCaseTool: Tool = {
  name: 'fogbugz_create_case',
  description: 'Creates a new FogBugz case, optionally with tags, a parent case, subcases, and screenshot attachments.',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title or summary of the issue',
      },
      description: {
        type: 'string',
        description: 'Detailed description of the issue',
        optional: true,
      },
      project: {
        type: 'string',
        description: 'Project name where the case should be created',
        optional: true,
      },
      area: {
        type: 'string',
        description: 'Area name within the project',
        optional: true,
      },
      milestone: {
        type: 'string',
        description: 'Milestone (FixFor) name',
        optional: true,
      },
      priority: {
        type: ['number', 'string'],
        description: 'Priority level (number 1-7) or name',
        optional: true,
      },
      assignee: {
        type: 'string',
        description: 'Person to assign the case to',
        optional: true,
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags to set on the new case',
        optional: true,
      },
      parentCase: {
        type: 'number',
        description: 'Case ID to make the new case a subcase of',
        optional: true,
      },
      childCases: {
        type: 'array',
        items: { type: 'number' },
        description: 'Existing case IDs to attach as subcases of the new case',
        optional: true,
      },
      attachmentPath: {
        type: 'string',
        description: 'Path to a screenshot or file to attach',
        optional: true,
      },
    },
    required: ['title'],
  },
};

// Fix the `createCaseTool` definition
createCaseTool.execute = async (input: { title: string; project: string }) => {
  const projects = await resources.projects.fetch();
  const project = projects.find((p: { name: string }) => p.name === input.project);
  if (!project) {
    throw new Error(`Project "${input.project}" not found.`);
  }
  // Proceed with creating the case...
};

// Tool: Update an existing FogBugz case
export const updateCaseTool: Tool = {
  name: 'fogbugz_update_case',
  description: 'Updates an existing FogBugz case with new field values, including tags and parent/child case relationships. Does not change case status.',
  inputSchema: {
    type: 'object',
    properties: {
      caseId: {
        type: 'number',
        description: 'The ID of the case to update',
      },
      title: {
        type: 'string',
        description: 'New title for the case',
        optional: true,
      },
      description: {
        type: 'string',
        description: 'Additional comment to add to the case',
        optional: true,
      },
      project: {
        type: 'string',
        description: 'Project to move the case to',
        optional: true,
      },
      area: {
        type: 'string',
        description: 'Area within the project',
        optional: true,
      },
      milestone: {
        type: 'string',
        description: 'Milestone (FixFor) name',
        optional: true,
      },
      priority: {
        type: ['number', 'string'],
        description: 'Priority level (number 1-7) or name',
        optional: true,
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Complete list of tags for the case. This REPLACES all existing tags - any tag not in this list is removed. To add or remove individual tags without disturbing the rest, use addTags/removeTags instead.',
        optional: true,
      },
      addTags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags to add, preserving the tags already on the case. Case-insensitive, so duplicates are ignored.',
        optional: true,
      },
      removeTags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags to remove, preserving the other tags on the case. Case-insensitive.',
        optional: true,
      },
      parentCase: {
        type: 'number',
        description: 'Case ID to make this case a subcase of. Use 0 to detach it from its current parent.',
        optional: true,
      },
      childCases: {
        type: 'array',
        items: { type: 'number' },
        description: 'Case IDs to attach as subcases of this case. Additive - existing children are left alone. To detach a child, update that child with parentCase 0.',
        optional: true,
      },
      attachmentPath: {
        type: 'string',
        description: 'Path to a screenshot or file to attach',
        optional: true,
      },
    },
    required: ['caseId'],
  },
};

// Tool: Assign a FogBugz case to a user
export const assignCaseTool: Tool = {
  name: 'fogbugz_assign_case',
  description: 'Assigns a FogBugz case to a specific user.',
  inputSchema: {
    type: 'object',
    properties: {
      caseId: {
        type: 'number',
        description: 'The ID of the case to assign',
      },
      assignee: {
        type: 'string',
        description: 'Name or email of the person to assign the case to',
      },
    },
    required: ['caseId', 'assignee'],
  },
};

// Tool: List cases assigned to a user
export const listUserCasesTool: Tool = {
  name: 'fogbugz_list_my_cases',
  description: 'Lists FogBugz cases assigned to a specific user.',
  inputSchema: {
    type: 'object',
    properties: {
      assignee: {
        type: 'string',
        description: 'Name or email of the person whose cases to list (defaults to current user if empty)',
        optional: true,
      },
      status: {
        type: 'string',
        description: 'Filter by status (e.g., "active", "closed")',
        optional: true,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of cases to return',
        optional: true,
      },
    },
    required: [],
  },
};

// Tool: Search for cases in FogBugz
export const searchCasesTool: Tool = {
  name: 'fogbugz_search_cases',
  description: 'Searches for FogBugz cases based on a query string. Supports FogBugz search syntax.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query string. Supports FogBugz search syntax (e.g., "project:Website status:Active")',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of cases to return',
        optional: true,
      },
    },
    required: ['query'],
  },
};

// Tool: Get a direct link to a FogBugz case
export const getCaseLinkTool: Tool = {
  name: 'fogbugz_get_case_link',
  description: 'Gets a direct URL link to a FogBugz case.',
  inputSchema: {
    type: 'object',
    properties: {
      caseId: {
        type: 'number',
        description: 'The ID of the case to get a link for',
      },
    },
    required: ['caseId'],
  },
};

// Tool: Create a new FogBugz project
export const createProjectTool: Tool = {
  name: 'fogbugz_create_project',
  description: 'Creates a new project in FogBugz.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the project to create',
      },
      primaryContact: {
        type: ['string', 'number'],
        description: 'User ID or name of the primary contact for the project',
        optional: true,
      },
      isInbox: {
        type: 'boolean',
        description: 'Whether this is an inbox project (default: false)',
        optional: true,
      },
      allowPublicSubmit: {
        type: 'boolean',
        description: 'Whether to allow public submissions to this project',
        optional: true,
      }
    },
    required: ['name'],
  },
};

// Tool: Download a FogBugz case with all attachments
export const downloadCaseTool: Tool = {
  name: 'fogbugz_download_case',
  description: 'Downloads a complete FogBugz case including metadata, events, and all attachments to a local directory.',
  inputSchema: {
    type: 'object',
    properties: {
      caseId: {
        type: 'number',
        description: 'The ID of the case to download',
      },
      outputDir: {
        type: 'string',
        description: 'The directory where the case data should be saved',
      },
    },
    required: ['caseId', 'outputDir'],
  },
};

export const listWikisTool: Tool = {
  name: 'fogbugz_list_wikis',
  description: 'Lists the FogBugz wikis visible to the current user.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export const listWikiArticlesTool: Tool = {
  name: 'fogbugz_list_wiki_articles',
  description: 'Lists the articles in a FogBugz wiki. Article bodies are available through fogbugz_view_wiki_article.',
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: {
        type: 'number',
        description: 'The FogBugz wiki ID',
      },
    },
    required: ['wikiId'],
  },
};

export const viewWikiArticleTool: Tool = {
  name: 'fogbugz_view_wiki_article',
  description: 'Retrieves a FogBugz wiki article, preserving its original FogBugz HTML body and optional attachment metadata.',
  inputSchema: {
    type: 'object',
    properties: {
      articleId: {
        type: 'number',
        description: 'The FogBugz wiki article ID (ixWikiPage)',
      },
      revision: {
        type: 'number',
        description: 'Optional revision number; defaults to the latest revision',
        optional: true,
      },
    },
    required: ['articleId'],
  },
};

export const searchWikiArticlesTool: Tool = {
  name: 'fogbugz_search_wiki_articles',
  description: 'Searches FogBugz wiki article headlines, HTML bodies, and tags. This is separate from case search and is bounded by limit.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Text to find in article headlines, HTML bodies, or tags',
      },
      wikiId: {
        type: 'number',
        description: 'Optional wiki ID to restrict the search',
        optional: true,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of matching articles to return (default: 20)',
        optional: true,
      },
    },
    required: ['query'],
  },
};

export const downloadWikiAttachmentTool: Tool = {
  name: 'fogbugz_download_wiki_attachment',
  description: 'Downloads a FogBugz wiki image or other attachment using its sURL to a local path.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The attachment sURL returned by FogBugz, usually from a wiki article response',
      },
      outputPath: {
        type: 'string',
        description: 'Local path where the attachment should be saved',
      },
    },
    required: ['url', 'outputPath'],
  },
};

export const createWikiArticleTool: Tool = {
  name: 'fogbugz_create_wiki_article',
  description: 'Creates a FogBugz wiki article. body must be FogBugz HTML, not Markdown; the server sends it unchanged. Use HTML paragraphs/headings/lists, FogBugz internal wiki links (for example href="default.asp?W63"), and uploaded attachment URLs.',
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'number', description: 'The FogBugz wiki ID' },
      headline: { type: 'string', description: 'Article title' },
      body: { type: 'string', description: 'Complete article body as FogBugz HTML. Use <p> or <br> for visible line breaks; literal newline encoding is not specified by FogBugz.' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Optional article tags' },
    },
    required: ['wikiId', 'headline', 'body'],
  },
};

export const editWikiArticleTool: Tool = {
  name: 'fogbugz_edit_wiki_article',
  description: 'Edits a FogBugz wiki article and creates a new revision. Supply only fields to change. If body is supplied, it replaces the entire article body and must be FogBugz HTML, not Markdown; it is sent unchanged. Supplying tags replaces the complete tag list.',
  inputSchema: {
    type: 'object',
    properties: {
      articleId: { type: 'number', description: 'The FogBugz article ID (ixWikiPage)' },
      headline: { type: 'string', description: 'Optional replacement headline' },
      body: { type: 'string', description: 'Optional complete replacement body as FogBugz HTML; use <p> or <br> for visible line breaks' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Optional complete replacement tag list; an empty array clears tags' },
      revisionComment: { type: 'string', description: 'Optional comment recorded with the new revision' },
    },
    required: ['articleId'],
  },
};

export const uploadWikiAttachmentTool: Tool = {
  name: 'fogbugz_upload_wiki_attachment',
  description: 'Uploads one image or other file to a FogBugz wiki and returns safe, relative HTML link/image snippets for use in an article body. The upload does not itself edit an article.',
  inputSchema: {
    type: 'object',
    properties: {
      wikiId: { type: 'number', description: 'The FogBugz wiki ID to receive the file' },
      filePath: { type: 'string', description: 'Path to the local image or file to upload' },
    },
    required: ['wikiId', 'filePath'],
  },
};

// All tools
export const fogbugzTools = [
  createCaseTool,
  updateCaseTool,
  assignCaseTool,
  listUserCasesTool,
  searchCasesTool,
  getCaseLinkTool,
  createProjectTool,
  downloadCaseTool,
  listWikisTool,
  listWikiArticlesTool,
  viewWikiArticleTool,
  searchWikiArticlesTool,
  downloadWikiAttachmentTool,
  createWikiArticleTool,
  editWikiArticleTool,
  uploadWikiAttachmentTool,
  {
    name: 'fogbugz_get_case_details',
    description: 'Gets the full content of a FogBugz case, including title, tags, parent/child cases, and all events.',
    inputSchema: {
      type: 'object',
      properties: {
        caseId: {
          type: 'number',
          description: 'The ID of the case to get details for',
        },
      },
      required: ['caseId'],
    },
  },
];
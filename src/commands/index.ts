/**
 * Gets full details of a FogBugz case, including title and all events
 */
export async function getCaseDetails(api: FogBugzApi, args: any): Promise<string> {
  const { caseId } = args;
  try {
    // Use the search endpoint with cols=["events"]
    const cases = await api.searchCases({
      q: caseId.toString(),
      cols: [
        'ixBug',
        'sTitle',
        'sStatus',
        'sPriority',
        'sProject',
        'sArea',
        'sFixFor',
        'tags',
        'ixBugParent',
        'ixBugChildren',
        'events',
      ],
      max: 1,
    });
    if (!cases || cases.length === 0) {
      return JSON.stringify({ error: `Case ${caseId} not found.` });
    }
    const bugCase = cases[0];
    return JSON.stringify({
      caseId: bugCase.ixBug,
      title: bugCase.sTitle,
      status: bugCase.sStatus,
      priority: bugCase.sPriority,
      project: bugCase.sProject,
      area: bugCase.sArea,
      milestone: bugCase.sFixFor,
      tags: normalizeTags(bugCase.tags),
      parentCase: bugCase.ixBugParent || null,
      childCases: Array.isArray(bugCase.ixBugChildren) ? bugCase.ixBugChildren : [],
      events: bugCase.events,
      message: `Fetched details for case #${bugCase.ixBug}: "${bugCase.sTitle}"`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

function normalizeWikiTags(article: any): string[] {
  if (Array.isArray(article.tags)) {
    return article.tags
      .map((tag: any) => typeof tag === 'string' ? tag : tag?.sTag ?? tag?.tag)
      .filter((tag: any): tag is string => typeof tag === 'string' && tag.length > 0);
  }
  if (Array.isArray(article.sTags)) return article.sTags;
  if (typeof article.sTags === 'string') return article.sTags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
  return [];
}

function normalizeWikiArticle(article: any): any {
  return {
    ...article,
    tags: normalizeWikiTags(article),
  };
}

export async function listWikis(api: FogBugzApi): Promise<string> {
  try {
    return JSON.stringify(await api.listWikis());
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

export async function listWikiArticles(api: FogBugzApi, args: any): Promise<string> {
  try {
    const articles = await api.listArticles(args.wikiId);
    return JSON.stringify(articles.map(normalizeWikiArticle));
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

export async function viewWikiArticle(api: FogBugzApi, args: any): Promise<string> {
  try {
    const article = await api.viewArticle(args.articleId, args.revision);
    return JSON.stringify({
      ...normalizeWikiArticle(article),
      ixWikiPage: article.ixWikiPage ?? args.articleId,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

export async function searchWikiArticles(api: FogBugzApi, args: any): Promise<string> {
  const query = String(args.query || '').trim().toLowerCase();
  const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 100);

  if (!query) return JSON.stringify({ error: 'query is required' });

  try {
    const wikiIds = args.wikiId !== undefined
      ? [Number(args.wikiId)]
      : (await api.listWikis()).map(wiki => wiki.ixWiki);
    const matches: any[] = [];

    for (const wikiId of wikiIds) {
      const articles = await api.listArticles(wikiId);
      for (const article of articles) {
        if (matches.length >= limit) break;
        const details = normalizeWikiArticle(await api.viewArticle(article.ixWikiPage));
        details.ixWiki = details.ixWiki ?? wikiId;
        details.ixWikiPage = details.ixWikiPage ?? article.ixWikiPage;
        const haystack = [details.sHeadline, details.sBody, ...details.tags]
          .filter(Boolean)
          .join('\n')
          .toLowerCase();
        if (haystack.includes(query)) {
          matches.push(details);
        }
      }
      if (matches.length >= limit) break;
    }

    return JSON.stringify({ query: args.query, count: matches.length, articles: matches });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

export async function downloadWikiAttachment(api: FogBugzApi, args: any): Promise<string> {
  try {
    const url = api.getAuthenticatedFileUrl(args.url);
    await api.downloadFile(url, args.outputPath);
    return JSON.stringify({ outputPath: args.outputPath, message: 'Wiki attachment downloaded successfully.' });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

export async function createWikiArticle(api: FogBugzApi, args: any): Promise<string> {
  try {
    const article = await api.createArticle({
      ixWiki: args.wikiId,
      sHeadline: args.headline,
      sBody: args.body,
      ...(Array.isArray(args.tags) && args.tags.length > 0 ? { sTags: args.tags.join(',') } : {}),
    });
    return JSON.stringify({
      wikiId: args.wikiId,
      articleId: article.ixWikiPage,
      headline: article.sHeadline ?? args.headline,
      message: `Created wiki article "${article.sHeadline ?? args.headline}".`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

export async function editWikiArticle(api: FogBugzApi, args: any): Promise<string> {
  const params: EditWikiArticleParams = { ixWikiPage: args.articleId };
  let hasChange = false;

  if (args.headline !== undefined) {
    params.sHeadline = args.headline;
    hasChange = true;
  }
  if (args.body !== undefined) {
    params.sBody = args.body;
    hasChange = true;
  }
  if (args.tags !== undefined) {
    if (!Array.isArray(args.tags)) return JSON.stringify({ error: 'tags must be an array of strings' });
    params.sTags = args.tags.join(',');
    hasChange = true;
  }
  if (args.revisionComment !== undefined) params.sComment = args.revisionComment;

  if (!hasChange) {
    return JSON.stringify({ error: 'Provide at least one field to change: headline, body, or tags.' });
  }

  try {
    let bodyUnchanged = false;
    let currentArticle: any;
    if (typeof params.sBody === 'string' || params.sHeadline === undefined) {
      currentArticle = await api.viewArticle(args.articleId);
    }
    if (typeof params.sBody === 'string') {
      if (typeof currentArticle.sBody === 'string' &&
          normalizeLineEndings(currentArticle.sBody) === normalizeLineEndings(params.sBody)) {
        delete params.sBody;
        bodyUnchanged = true;
      }
    }

    const hasContentChange = args.headline !== undefined ||
      params.sBody !== undefined ||
      params.sTags !== undefined;
    if (!hasContentChange) {
      return JSON.stringify({
        articleId: args.articleId,
        unchanged: true,
        message: bodyUnchanged
          ? 'No article revision created: the body differs only by line endings.'
          : 'No article revision created: the requested content is unchanged.',
      });
    }

    if (params.sHeadline === undefined) {
      if (typeof currentArticle?.sHeadline !== 'string' || currentArticle.sHeadline.length === 0) {
        return JSON.stringify({ error: `Could not read the current headline for article ${args.articleId}.` });
      }
      params.sHeadline = currentArticle.sHeadline;
    }

    const article = await api.updateArticle(params);
    return JSON.stringify({
      articleId: args.articleId,
      headline: article.sHeadline ?? args.headline,
      message: `Updated wiki article ${args.articleId}; FogBugz created a new revision.`,
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

function escapeWikiHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function uploadWikiAttachment(api: FogBugzApi, args: any): Promise<string> {
  try {
    const attachment = await api.uploadWikiFile(args.wikiId, args.filePath);
    const url = escapeWikiHtml(attachment.sURL);
    const filename = escapeWikiHtml(attachment.sFileName);
    return JSON.stringify({
      wikiId: args.wikiId,
      fileName: attachment.sFileName,
      sURL: attachment.sURL,
      htmlImage: `<img src="${url}" alt="${filename}">`,
      htmlLink: `<a href="${url}">${filename}</a>`,
      message: 'Uploaded the file to the wiki. Use the returned HTML snippet in an article body; the URL is relative and contains no API token.',
    });
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}
import { EditWikiArticleParams, FogBugzApi } from '../api';
import { FileAttachment, CreateCaseParams, EditCaseParams, CreateProjectParams } from '../api/types';
import { BackupManager } from '../backup/manager';

/**
 * MCP command implementations for FogBugz operations
 */

/**
 * Normalizes the `tags` column. Live responses use a flat string array; the
 * API docs show [{ tag: "..." }], so accept either.
 */
function normalizeTags(raw: any): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t: any) => (typeof t === 'string' ? t : t?.tag ?? t?.sTag))
    .filter((t: any): t is string => typeof t === 'string' && t.length > 0);
}

/**
 * Fetches the tags currently on a case. `sTags` replaces the entire tag set,
 * so add/remove edits have to read the existing tags first.
 */
async function fetchCaseTags(api: FogBugzApi, caseId: number): Promise<string[]> {
  const cases = await api.searchCases({
    q: caseId.toString(),
    cols: ['ixBug', 'tags'],
    max: 1,
  });
  if (!cases || cases.length === 0) {
    throw new Error(`Case ${caseId} not found.`);
  }
  return normalizeTags(cases[0].tags);
}

/**
 * Applies add/remove lists to a tag set. FogBugz tags are case-insensitive, so
 * matching is too; existing casing wins on a duplicate add.
 */
function mergeTags(current: string[], add: string[] = [], remove: string[] = []): string[] {
  const removeSet = new Set(remove.map(t => t.toLowerCase()));
  const result = current.filter(t => !removeSet.has(t.toLowerCase()));
  for (const tag of add) {
    if (!result.some(t => t.toLowerCase() === tag.toLowerCase())) {
      result.push(tag);
    }
  }
  return result;
}

/**
 * Points each child case at `parentId`. FogBugz only exposes the child's
 * `ixBugParent`, so attaching children means editing each child in turn.
 * Returns a message for each child that could not be attached.
 */
async function attachChildCases(
  api: FogBugzApi,
  parentId: number,
  childCases: number[]
): Promise<string[]> {
  const failures: string[] = [];
  for (const childId of childCases) {
    try {
      await api.updateCase({ ixBug: childId, ixBugParent: parentId });
    } catch (error: any) {
      failures.push(`#${childId}: ${error.message}`);
    }
  }
  return failures;
}

/**
 * Creates a new FogBugz case
 */
export async function createCase(api: FogBugzApi, args: any): Promise<string> {
  const {
    title,
    description,
    project,
    area,
    milestone,
    priority,
    assignee,
    tags,
    parentCase,
    childCases,
    attachmentPath,
  } = args;

  // Prepare case parameters
  const params: CreateCaseParams = {
    sTitle: title,
  };

  // Add optional parameters if provided
  if (description) params.sEvent = description;
  if (project) params.sProject = project;
  if (area) params.sArea = area;
  if (milestone) params.sFixFor = milestone;
  if (assignee) params.sPersonAssignedTo = assignee;
  if (tags !== undefined) params.sTags = tags.join(',');
  // 0 means "no parent", so an explicit value has to survive the check
  if (parentCase !== undefined) params.ixBugParent = parentCase;

  // Handle priority (could be a number or string)
  if (priority !== undefined) {
    if (typeof priority === 'number') {
      params.ixPriority = priority;
    } else {
      params.sPriority = priority;
    }
  }

  // Prepare attachments if any
  const attachments: FileAttachment[] = [];
  if (attachmentPath) {
    attachments.push({
      path: attachmentPath,
      fieldName: 'File1',
    });
  }

  try {
    // Create the case
    const newCase = await api.createCase(params, attachments);

    // Children can only be attached once the parent has an ID
    const childFailures = childCases && childCases.length > 0
      ? await attachChildCases(api, newCase.ixBug, childCases)
      : [];

    // Generate a response
    const caseLink = api.getCaseLink(newCase.ixBug);
    return JSON.stringify({
      caseId: newCase.ixBug,
      caseLink,
      ...(tags !== undefined ? { tags } : {}),
      ...(parentCase !== undefined ? { parentCase } : {}),
      ...(childCases && childCases.length > 0
        ? { childCases: childCases.filter((id: number) => !childFailures.some(f => f.startsWith(`#${id}:`))) }
        : {}),
      ...(childFailures.length > 0 ? { childCaseErrors: childFailures } : {}),
      message: `Created case #${newCase.ixBug}: "${title}"${project ? ' in ' + project : ''}${assignee ? ', assigned to ' + assignee : ''}.`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Updates an existing FogBugz case
 */
export async function updateCase(api: FogBugzApi, args: any): Promise<string> {
  const {
    caseId,
    title,
    description,
    project,
    area,
    milestone,
    priority,
    tags,
    addTags,
    removeTags,
    parentCase,
    childCases,
    attachmentPath,
  } = args;

  // Prepare case parameters
  const params: EditCaseParams = {
    ixBug: caseId,
  };

  // Add optional parameters if provided
  if (title) params.sTitle = title;
  if (description) params.sEvent = description;
  if (project) params.sProject = project;
  if (area) params.sArea = area;
  if (milestone) params.sFixFor = milestone;
  // 0 detaches the case from its parent, so an explicit value has to survive the check
  if (parentCase !== undefined) params.ixBugParent = parentCase;

  // Handle priority (could be a number or string)
  if (priority !== undefined) {
    if (typeof priority === 'number') {
      params.ixPriority = priority;
    } else {
      params.sPriority = priority;
    }
  }

  // Prepare attachments if any
  const attachments: FileAttachment[] = [];
  if (attachmentPath) {
    attachments.push({
      path: attachmentPath,
      fieldName: 'File1',
    });
  }

  try {
    // `sTags` replaces the whole tag set, so add/remove has to start from the
    // current tags. An explicit `tags` list is the base when both are given.
    let resolvedTags: string[] | undefined;
    if (tags !== undefined || addTags !== undefined || removeTags !== undefined) {
      const base = tags !== undefined ? tags : await fetchCaseTags(api, caseId);
      resolvedTags = mergeTags(base, addTags, removeTags);
      params.sTags = resolvedTags.join(',');
    }

    // Update the case
    const updatedCase = await api.updateCase(params, attachments);

    const childFailures = childCases && childCases.length > 0
      ? await attachChildCases(api, caseId, childCases)
      : [];

    // Generate a response
    const caseLink = api.getCaseLink(updatedCase.ixBug);
    return JSON.stringify({
      caseId: updatedCase.ixBug,
      caseLink,
      ...(resolvedTags !== undefined ? { tags: resolvedTags } : {}),
      ...(parentCase !== undefined ? { parentCase } : {}),
      ...(childCases && childCases.length > 0
        ? { childCases: childCases.filter((id: number) => !childFailures.some(f => f.startsWith(`#${id}:`))) }
        : {}),
      ...(childFailures.length > 0 ? { childCaseErrors: childFailures } : {}),
      message: `Updated case #${updatedCase.ixBug}${title ? ': "' + title + '"' : ''}.`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Assigns a FogBugz case to a user
 */
export async function assignCase(api: FogBugzApi, args: any): Promise<string> {
  const { caseId, assignee } = args;

  try {
    // Assign the case
    const updatedCase = await api.assignCase(caseId, assignee);
    
    // Generate a response
    const caseLink = api.getCaseLink(updatedCase.ixBug);
    return JSON.stringify({
      caseId: updatedCase.ixBug,
      caseLink,
      message: `Assigned case #${updatedCase.ixBug} to ${assignee}.`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Lists FogBugz cases assigned to a user
 */
export async function listUserCases(api: FogBugzApi, args: any): Promise<string> {
  const { assignee, status, limit } = args;

  try {
    // Create query for assigned cases
    let query = '';
    
    if (assignee) {
      query = `assignedto:"${assignee}"`;
    } else {
      query = 'assignedto:me';
    }
    
    if (status) {
      query += ` status:${status}`;
    } else {
      query += ' status:active';
    }
    
    // Get cases assigned to the user
    const cases = await api.searchCases({
      q: query,
      cols: [
        'ixBug',
        'sTitle',
        'sStatus',
        'sPriority',
        'sProject',
        'sArea',
        'sFixFor',
      ],
      max: limit || 20,
    });
    
    // Format case information
    const formattedCases = cases.map(bugCase => ({
      id: bugCase.ixBug,
      title: bugCase.sTitle,
      status: bugCase.sStatus,
      priority: bugCase.sPriority,
      project: bugCase.sProject,
      area: bugCase.sArea,
      milestone: bugCase.sFixFor,
      link: api.getCaseLink(bugCase.ixBug),
    }));
    
    // Generate a response
    const userDisplay = assignee || 'current user';
    return JSON.stringify({
      assignee: userDisplay,
      count: formattedCases.length,
      cases: formattedCases,
      message: `Found ${formattedCases.length} active cases assigned to ${userDisplay}.`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Searches for FogBugz cases
 */
export async function searchCases(api: FogBugzApi, args: any): Promise<string> {
  const { query, limit } = args;

  try {
    // Search for cases
    const cases = await api.searchCases({
      q: query,
      cols: [
        'ixBug',
        'sTitle',
        'sStatus',
        'sPriority',
        'sProject',
        'sArea',
        'sFixFor',
        'sPersonAssignedTo',
      ],
      max: limit || 20,
    });
    
    // Format case information
    const formattedCases = cases.map(bugCase => ({
      id: bugCase.ixBug,
      title: bugCase.sTitle,
      status: bugCase.sStatus,
      priority: bugCase.sPriority,
      project: bugCase.sProject,
      area: bugCase.sArea,
      milestone: bugCase.sFixFor,
      assignee: bugCase.sPersonAssignedTo,
      link: api.getCaseLink(bugCase.ixBug),
    }));
    
    // Generate a response
    return JSON.stringify({
      query,
      count: formattedCases.length,
      cases: formattedCases,
      message: `Found ${formattedCases.length} cases matching query: "${query}".`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Gets a direct link to a FogBugz case
 */
export async function getCaseLink(api: FogBugzApi, args: any): Promise<string> {
  const { caseId } = args;

  try {
    // Generate case link
    const caseLink = api.getCaseLink(caseId);
    
    return JSON.stringify({
      caseId,
      caseLink,
      message: `Link to case #${caseId}: ${caseLink}`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Creates a new FogBugz project
 */
export async function createProject(api: FogBugzApi, args: any): Promise<string> {
  const {
    name,
    primaryContact,
    isInbox,
    allowPublicSubmit
  } = args;

  try {
    // Prepare project parameters
    const params: CreateProjectParams = {
      sProject: name
    };

    // Add optional parameters if provided
    // For primaryContact, we need to use the ixPersonPrimaryContact parameter
    if (primaryContact) {
      if (!isNaN(Number(primaryContact))) {
        params.ixPersonPrimaryContact = Number(primaryContact);
      } else {
        // Look the person up by name or email rather than guessing an ID.
        // Report an unmatched name instead of silently creating the project
        // without the contact the caller asked for.
        const people = await api.listPeople();
        const wanted = String(primaryContact).toLowerCase();
        const match = people.find(
          person =>
            person.sFullName?.toLowerCase() === wanted ||
            person.sPerson?.toLowerCase() === wanted ||
            person.sEmail?.toLowerCase() === wanted
        );
        if (!match) {
          return JSON.stringify({
            error: `Primary contact "${primaryContact}" not found. Pass a full name, email, or ixPerson ID.`,
          });
        }
        params.ixPersonPrimaryContact = match.ixPerson;
      }
    }
    
    if (isInbox !== undefined) params.fInbox = isInbox;
    if (allowPublicSubmit !== undefined) params.fAllowPublicSubmit = allowPublicSubmit;

    // Create the project
    const newProject = await api.createProject(params);
    
    // Generate a response
    return JSON.stringify({
      projectId: newProject.ixProject,
      projectName: newProject.sProject,
      message: `Created new project: "${newProject.sProject}" (ID: ${newProject.ixProject})`,
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
}

/**
 * Downloads a complete FogBugz case with all data and attachments
 */
export async function downloadCase(api: FogBugzApi, args: any): Promise<string> {
  const { caseId, outputDir } = args;

  try {
    // Initialize backup manager
    const backupManager = new BackupManager(api, outputDir);
    await backupManager.initialize();

    // Download the case
    const result = await backupManager.downloadCase(caseId);

    return JSON.stringify({
      caseId: result.caseId,
      status: result.status,
      message: result.message,
      attachmentCount: result.attachmentCount,
      outputPath: `${outputDir}/case-${caseId}`
    });
  } catch (error: any) {
    return JSON.stringify({
      error: error.message,
    });
  }
} 
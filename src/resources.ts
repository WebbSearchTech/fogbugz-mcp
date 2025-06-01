import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const FOGBUGZ_API_KEY = process.env.FOGBUGZ_API_KEY || '';
const FOGBUGZ_BASE_URL = process.env.FOGBUGZ_URL || '';
const FOGBUGZ_API_ENDPOINT = `${FOGBUGZ_BASE_URL}/f/api/0/jsonapi`;

if (!FOGBUGZ_API_KEY || !FOGBUGZ_BASE_URL) {
  console.error('Error: Missing FogBugz API configuration in environment variables.');
  process.exit(1);
}

// Create an Axios instance with a timeout and custom agent
const axiosInstance = axios.create({
  timeout: 10000, // Set a 10-second timeout
  httpsAgent: new https.Agent({ keepAlive: true }),
});

// Retry logic
const retryRequest = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < retries) {
        console.warn(`Retrying request (attempt ${attempt} of ${retries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Retry attempts exhausted"); // Ensure a return statement in all code paths
};

/**
 * MCP Resource definitions for FogBugz operations
 */

// Define a generic Resource interface
interface Resource<T> {
  name: string;
  initialize?: () => Promise<void>;
  fetch: (...args: any[]) => Promise<T>;
  refresh?: () => Promise<void>;
}

// Cache for storing resource data
type User = { id: number; name: string };
type Project = { id: number; name: string };
type Area = { id: number; name: string; projectId: number };
type Milestone = { id: number; name: string; projectId: number | null; ixProject?: number; ixFixFor?: number };

// Define types for additional resources
interface Priority {
  id: number;
  name: string;
  fDefault: boolean;
}

interface Category {
  id: number;
  name: string;
  sPlural: string;
  ixStatusDefault: number;
}

interface Status {
  id: number;
  name: string;
  fResolved: boolean;
  fWorkDone: boolean;
  fDuplicate: boolean;
}

// Define a type for Tag
interface Tag {
  id: number;
  name: string;
}

// Update the cache object to reflect these types
let cache: {
  users: User[];
  projects: Project[];
  areas: { [projectId: number]: Area[] };
  milestones: { [projectId: number]: Milestone[] };
  priorities: Priority[];
  categories: Category[];
  statuses: { [categoryId: number]: Status[] };
  tags: Tag[];
} = {
  users: [],
  projects: [],
  areas: {},
  milestones: {},
  priorities: [],
  categories: [],
  statuses: {},
  tags: [],
};

// Helper functions to normalize data
const normalizePriorities = (priorities: any[]): Priority[] => {
  return priorities.map(priority => ({
    id: priority.ixPriority, // Rename ixPriority to id
    name: priority.sPriority, // Rename sPriority to name
    ...priority, // Retain all other original properties
  }));
};

const normalizeCategories = (categories: any[]): Category[] => {
  return categories.map(category => ({
    id: category.ixCategory, // Rename ixCategory to id
    name: category.sCategory, // Rename sCategory to name
    ...category, // Retain all other original properties
  }));
};

const normalizeStatuses = (statuses: any[]): Status[] => {
  return statuses.map(status => ({
    id: status.ixStatus, // Rename ixStatus to id
    name: status.sStatus, // Rename sStatus to name
    ...status, // Retain all other original properties
  }));
};

// Helper function to normalize milestone data
const normalizeMilestones = (milestones: any[], projectId: number): Milestone[] => {
  return milestones.map(milestone => {
    const isShared = milestone.ixProject === 0; // Check if the milestone is shared
    return {
      id: milestone.ixFixFor, // Rename ixFixFor to id
      name: milestone.sFixFor, // Rename sFixFor to name
      projectId: isShared ? null : projectId, // Use null for shared milestones
      ixProject: milestone.ixProject, // Retain raw API property
      ixFixFor: milestone.ixFixFor, // Retain raw API property
      ...milestone, // Retain all other original properties
    };
  });
};

// Helper function to normalize area data
const normalizeAreas = (areas: any[], projectId: number): Area[] => {
  return areas.map(area => ({
    id: area.ixArea, // Rename ixArea to id
    name: area.sArea, // Rename sArea to name
    projectId, // Add projectId for context
    ...area, // Retain all other original properties
  }));
};

// Resource: Users
export const usersResource: Resource<any[]> = {
  name: 'users',
  initialize: async () => {
    cache.users = await api.listPeople();
  },
  fetch: async () => {
    return cache.users;
  },
};

// Ensure projects are retrieved before milestones and areas
export const projectsResource: Resource<any[]> = {
  name: 'projects',
  initialize: async () => {
    console.log('Initializing projects resource...');
    const projects = await api.listProjects();
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      console.warn('Warning: No projects found during initialization.');
    } else {
      cache.projects = projects.filter(project => project.id && project.name);
      console.log(`Projects initialized: ${cache.projects.length} valid projects found.`);
      if (cache.projects.length !== projects.length) {
        console.warn('Warning: Some projects were skipped due to missing id or name.');
      }
    }
  },
  fetch: async () => {
    return cache.projects;
  },
};

// Resource: Tags
export const tagsResource: Resource<Tag[]> = {
  name: 'tags',
  initialize: async () => {
    cache.tags = await api.listTags();
  },
  fetch: async () => {
    return cache.tags;
  },
};

// Update milestones resource to depend on projects being initialized
export const milestonesResource: Resource<any[]> = {
  name: 'milestones',
  initialize: async () => {
    if (!cache.projects.length) {
      throw new Error('Projects must be initialized before initializing milestones');
    }

    for (const project of cache.projects) {
      if (!project.id) {
        console.error(`Skipping milestones for project with invalid ID:`, project);
        continue;
      }
      try {
        const milestones = await api.listMilestones(project.id);
        if (!milestones || !Array.isArray(milestones)) {
          console.warn(`Warning: No milestones found for project ID ${project.id}.`);
        } else {
          cache.milestones[project.id] = milestones;
          //console.log(`Milestones initialized for project ID ${project.id}:`, milestones);
        }
      } catch (error: any) {
        console.error(`Failed to fetch milestones for project ID ${project.id}:`, error.message);
      }
    }
  },
  fetch: async () => {
    return Object.values(cache.milestones).flat();
  },
};

// Update areas resource to depend on projects being initialized
export const areasResource: Resource<any[]> = {
  name: 'areas',
  initialize: async () => {
    if (!cache.projects.length) {
      throw new Error('Projects must be initialized before initializing areas');
    }
    for (const project of cache.projects) {
      if (!project.id) {
        console.error(`Skipping areas for project with invalid ID:`, project);
        continue;
      }
      try {
        const areas = await api.listAreas(project.id);
        if (!areas || !Array.isArray(areas)) {
          console.warn(`Warning: No areas found for project ID ${project.id}.`);
        } else {
          cache.areas[project.id] = areas;
          //console.log(`Areas initialized for project ID ${project.id}:`, areas);
        }
      } catch (error: any) {
        console.error(`Failed to fetch areas for project ID ${project.id}:`, error.message);
      }
    }
  },
  fetch: async () => {
    return Object.values(cache.areas).flat();
  },
};

// Add priorities resource
export const prioritiesResource: Resource<any[]> = {
  name: 'priorities',
  initialize: async () => {
    const priorities = await api.listPriorities();
    if (!priorities || !Array.isArray(priorities) || priorities.length === 0) {
      console.warn('Warning: No priorities found during initialization.');
    } else {
      cache.priorities = priorities.filter(priority => priority.ixPriority && priority.sPriority);
      if (cache.priorities.length !== priorities.length) {
        console.warn('Warning: Some priorities were skipped due to missing ixPriority or sPriority.');
      }
    }
  },
  fetch: async () => {
    const priorities = await api.listPriorities();
    return normalizePriorities(priorities);
  },
};

// Add categories resource
export const categoriesResource: Resource<any[]> = {
  name: 'categories',
  fetch: async () => {
    const categories = await api.listCategories();
    return normalizeCategories(categories);
  },
};

// Add statuses resource
export const statusesResource: Resource<any[]> = {
  name: 'statuses',
  fetch: async (categoryId: number) => {
    const statuses = await api.listStatuses(categoryId);
    return normalizeStatuses(statuses);
  },
};

// Export all resources
export const resources = {
  users: usersResource,
  projects: projectsResource,
  tags: tagsResource,
  milestones: milestonesResource,
  areas: areasResource,
  priorities: prioritiesResource,
  categories: categoriesResource,
  statuses: statusesResource,
};

// Replace dummy data with actual API calls
const api = {
  listPeople: async () => {
    try {
      const response = await axiosInstance.post(`${FOGBUGZ_API_ENDPOINT}`, {
        cmd: 'listPeople',
        token: FOGBUGZ_API_KEY,
      });
      if (!response.data || !response.data.data || !response.data.data.people) {
        throw new Error('Invalid response structure for listPeople');
      }
      return response.data.data.people;
    } catch (error: any) {
      console.error('Error in listPeople:', error.message);
      throw error;
    }
  },
  // Updated helper function to normalize project data while retaining all original properties
  normalizeProjects: (projects: any[]): Project[] => {
    return projects.map(project => ({
      id: project.ixProject, // Rename ixProject to id
      name: project.sProject, // Rename sProject to name
      ...project, // Retain all other original properties
    }));
  },
  listProjects: async () => {
    try {
      const response = await retryRequest(() =>
        axiosInstance.post(`${FOGBUGZ_API_ENDPOINT}`, {
          cmd: 'listProjects',
          token: FOGBUGZ_API_KEY,
        })
      );

      if (!response.data || !response.data.data || !response.data.data.projects) {
        throw new Error('Invalid response structure for listProjects');
      }

      // Normalize the project data
      return api.normalizeProjects(response.data.data.projects);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Axios error in listProjects:', {
          message: error.message,
          code: error.code,
          config: error.config,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data,
          } : null,
        });
      } else {
        console.error('Unexpected error in listProjects:', error);
      }
      throw error;
    }
  },
  listAreas: async (projectId: number) => {
    try {
      const response = await axiosInstance.post(`${FOGBUGZ_API_ENDPOINT}`, {
        cmd: 'listAreas',
        token: FOGBUGZ_API_KEY,
        ixProject: projectId,
      });

      if (!response.data || !response.data.data || !Array.isArray(response.data.data.areas)) {
        throw new Error('Invalid response structure for listAreas');
      }

      // Normalize the area data
      return normalizeAreas(response.data.data.areas, projectId);
    } catch (error: any) {
      console.error(`Error in listAreas for projectId ${projectId}:`, error.message);
      throw error;
    }
  },
  listMilestones: async (projectId: number) => {
    if (!projectId) {
      throw new Error('Invalid projectId provided to listMilestones');
    }

    try {
      const response = await axiosInstance.post(`${FOGBUGZ_API_ENDPOINT}`, {
        cmd: 'listFixFors',
        token: FOGBUGZ_API_KEY,
        ixProject: projectId,
      });

      if (!response.data || !response.data.data || !Array.isArray(response.data.data.fixfors)) {
        throw new Error('Invalid response structure for listMilestones');
      }

      // Normalize the milestone data
      return normalizeMilestones(response.data.data.fixfors, projectId);
    } catch (error: any) {
      console.error(`Error in listMilestones for projectId ${projectId}:`, error.message);
      throw error;
    }
  },
  listTags: async () => {
    try {
      const response = await axiosInstance.post(`${FOGBUGZ_API_ENDPOINT}`, {
        cmd: 'listTags',
        token: FOGBUGZ_API_KEY,
      });
      if (!response.data || !response.data.data || !response.data.data.tags) {
        throw new Error('Invalid response structure for listTags');
      }
      return response.data.data.tags;
    } catch (error: any) {
      console.error('Error in listTags:', error.message);
      throw error;
    }
  },
  listPriorities: async () => {
    try {
      const response = await axiosInstance.post(`${FOGBUGZ_API_ENDPOINT}`, {
        cmd: 'listPriorities',
        token: FOGBUGZ_API_KEY,
      });
      if (!response.data || !response.data.data || !response.data.data.priorities) {
        throw new Error('Invalid response structure for listPriorities');
      }
      return response.data.data.priorities;
    } catch (error: any) {
      console.error('Error in listPriorities:', error.message);
      throw error;
    }
  },
  listCategories: async () => {
    try {
      const response = await axiosInstance.post(`${FOGBUGZ_API_ENDPOINT}`, {
        cmd: 'listCategories',
        token: FOGBUGZ_API_KEY,
      });
      if (!response.data || !response.data.data || !response.data.data.categories) {
        throw new Error('Invalid response structure for listCategories');
      }
      return response.data.data.categories;
    } catch (error: any) {
      console.error('Error in listCategories:', error.message);
      throw error;
    }
  },
  listStatuses: async (categoryId: number) => {
    try {
      const response = await axiosInstance.post(`${FOGBUGZ_API_ENDPOINT}`, {
        cmd: 'listStatuses',
        token: FOGBUGZ_API_KEY,
        ixCategory: categoryId,
      });
      if (!response.data || !response.data.data || !response.data.data.statuses) {
        throw new Error('Invalid response structure for listStatuses');
      }
      return response.data.data.statuses;
    } catch (error: any) {
      console.error(`Error in listStatuses for categoryId ${categoryId}:`, error.message);
      throw error;
    }
  },
};

// Add a global initialization function to ensure all resources are initialized before use
const initializeAllResources = async () => {
    console.log('🔄 Initializing all resources...');

    // Initialize resources sequentially to handle dependencies
    await exports.usersResource.initialize?.();
    await exports.projectsResource.initialize?.();
    await exports.tagsResource.initialize?.();
    await exports.milestonesResource.initialize?.();
    await exports.areasResource.initialize?.();
    await exports.prioritiesResource.initialize?.();

    console.log('✅ All resources initialized.');
};

// Export the initialization function
exports.initializeAllResources = initializeAllResources;
export { initializeAllResources };

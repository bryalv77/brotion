import type { PageTemplateDefinition } from "./types.js";
import { taskManagerTemplate } from "./taskManager.js";
import { secondBrainTemplate } from "./secondBrain.js";
import { projectManagementTemplate } from "./projectManagement.js";
import { crmTemplate } from "./crm.js";
import { habitTrackerTemplate } from "./habitTracker.js";
import { knowledgeBaseTemplate } from "./knowledgeBase.js";
import { readingListTemplate } from "./readingList.js";
import { financeTrackerTemplate } from "./financeTracker.js";
import { contentPlannerTemplate } from "./contentPlanner.js";
import { studentPlannerTemplate } from "./studentPlanner.js";

export const ALL_PAGE_TEMPLATES: PageTemplateDefinition[] = [
  taskManagerTemplate,
  secondBrainTemplate,
  projectManagementTemplate,
  crmTemplate,
  habitTrackerTemplate,
  knowledgeBaseTemplate,
  readingListTemplate,
  financeTrackerTemplate,
  contentPlannerTemplate,
  studentPlannerTemplate,
];

export function findPageTemplate(id: string): PageTemplateDefinition | undefined {
  return ALL_PAGE_TEMPLATES.find((t) => t.id === id);
}

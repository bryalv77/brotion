import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { csrfGuard } from "../../middleware/csrf.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createDatabaseHandler,
  listPageDatabasesHandler,
  getDatabaseHandler,
  updateDatabaseHandler,
  deleteDatabaseHandler,
  addPropertyHandler,
  updatePropertyHandler,
  deletePropertyHandler,
  movePropertyHandler,
  addRowHandler,
  deleteRowHandler,
  moveRowHandler,
  updatePropertyValueHandler,
  createViewHandler,
  updateViewHandler,
  deleteViewHandler,
  moveViewHandler,
  createTemplateHandler,
  listTemplatesHandler,
  getTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
} from "./databases.controller.js";

// Routes under /pages/:pageId/databases — mergeParams for :pageId.
export const pageDatabasesRouter = Router({ mergeParams: true });
pageDatabasesRouter.use(requireAuth);
pageDatabasesRouter.get("/", asyncHandler(listPageDatabasesHandler));
pageDatabasesRouter.post("/", csrfGuard, asyncHandler(createDatabaseHandler));

// Routes under /databases
export const databasesRouter = Router();
databasesRouter.use(requireAuth);
databasesRouter.get("/:databaseId", asyncHandler(getDatabaseHandler));
databasesRouter.patch("/:databaseId", csrfGuard, asyncHandler(updateDatabaseHandler));
databasesRouter.delete("/:databaseId", csrfGuard, asyncHandler(deleteDatabaseHandler));
databasesRouter.post("/:databaseId/properties", csrfGuard, asyncHandler(addPropertyHandler));
databasesRouter.patch(
  "/:databaseId/properties/:propertyId",
  csrfGuard,
  asyncHandler(updatePropertyHandler),
);
databasesRouter.delete(
  "/:databaseId/properties/:propertyId",
  csrfGuard,
  asyncHandler(deletePropertyHandler),
);
databasesRouter.post(
  "/:databaseId/properties/:propertyId/move",
  csrfGuard,
  asyncHandler(movePropertyHandler),
);
databasesRouter.post("/:databaseId/rows", csrfGuard, asyncHandler(addRowHandler));
databasesRouter.post(
  "/:databaseId/rows/:rowPageId/move",
  csrfGuard,
  asyncHandler(moveRowHandler),
);

// Views (one data source, many lenses).
databasesRouter.post("/:databaseId/views", csrfGuard, asyncHandler(createViewHandler));
databasesRouter.patch(
  "/:databaseId/views/:viewId",
  csrfGuard,
  asyncHandler(updateViewHandler),
);
databasesRouter.delete(
  "/:databaseId/views/:viewId",
  csrfGuard,
  asyncHandler(deleteViewHandler),
);
databasesRouter.post(
  "/:databaseId/views/:viewId/move",
  csrfGuard,
  asyncHandler(moveViewHandler),
);

// Templates (factory rows for new pages).
databasesRouter.get(
  "/:databaseId/templates",
  asyncHandler(listTemplatesHandler),
);
databasesRouter.post(
  "/:databaseId/templates",
  csrfGuard,
  asyncHandler(createTemplateHandler),
);
databasesRouter.get(
  "/:databaseId/templates/:templateId",
  asyncHandler(getTemplateHandler),
);
databasesRouter.patch(
  "/:databaseId/templates/:templateId",
  csrfGuard,
  asyncHandler(updateTemplateHandler),
);
databasesRouter.delete(
  "/:databaseId/templates/:templateId",
  csrfGuard,
  asyncHandler(deleteTemplateHandler),
);

// Routes under /rows
export const rowsRouter = Router();
rowsRouter.use(requireAuth);
rowsRouter.patch(
  "/:rowPageId/properties/:propertyId",
  csrfGuard,
  asyncHandler(updatePropertyValueHandler),
);
rowsRouter.delete("/:rowPageId", csrfGuard, asyncHandler(deleteRowHandler));

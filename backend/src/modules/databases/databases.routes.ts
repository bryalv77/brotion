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
  addRowHandler,
  updatePropertyValueHandler,
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
databasesRouter.post("/:databaseId/rows", csrfGuard, asyncHandler(addRowHandler));

// Routes under /rows
export const rowsRouter = Router();
rowsRouter.use(requireAuth);
rowsRouter.patch(
  "/:rowPageId/properties/:propertyId",
  csrfGuard,
  asyncHandler(updatePropertyValueHandler),
);

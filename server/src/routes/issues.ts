import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireOrg } from "../middleware/requireOrg.js";
import { io } from "../index.js";

const router = Router();

router.get("/", requireOrg, async (req, res) => {
  const issues = await prisma.issue.findMany({
    where:{
      organizationId: req.organizationId,
      deletedAt: null,
    },
    orderBy:{ createdAt: "desc"},
  });
  res.json(issues);
});

router.post("/", requireOrg, async (req, res) => {
  const { title, description, priority, assigneeId } = req.body;

  if(!title?.trim()){
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const issue = await prisma.issue.create({
    data:{
      title,
      description: description ?? null,
      priority: priority ?? "MEDIUM",
      assigneeId: assigneeId ?? null,
      organizationId: req.organizationId,
      creatorId: req.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: req.organizationId,
      entityType: "Issue",
      entityId: issue.id,
      action: "created",
      actorId: req.user.id,
      actorName: req.user.name ?? req.user.email,
      diff: { title, priority: issue.priority },
    },
  });

  io.to(`workspace:${req.organizationId}`).emit("issue:created", issue);
  res.status(201).json(issue);
});

router.patch("/:id", requireOrg, async (req, res) => {
  const id = req.params.id as string;
  const { status, priority, title, description, assigneeId } = req.body;

  const existing = await prisma.issue.findFirst({
    where: { id, organizationId: req.organizationId, deletedAt: null },
  });

  if (!existing) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }

  const updated = await prisma.issue.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(assigneeId !== undefined && { assigneeId }),
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: req.organizationId,
      entityType: "Issue",
      entityId: id,
      action: "updated",
      actorId: req.user.id,
      actorName: req.user.name ?? req.user.email,
      diff: req.body,
    },
  });

  io.to(`workspace:${req.organizationId}`).emit("issue:updated", updated)
  res.json(updated);
});

router.delete("/:id", requireOrg, async (req, res) => {
  const id = req.params.id as string;

  const existing = await prisma.issue.findFirst({
    where: { id, organizationId: req.organizationId, deletedAt: null },
  });

  if (!existing) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }

  await prisma.issue.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: req.organizationId,
      entityType: "Issue",
      entityId: id,
      action: "deleted",
      actorId: req.user.id,
      actorName: req.user.name ?? req.user.email,
      diff: {},
    },
  });

  io.to(`workspace:${req.organizationId}`).emit("issue:deleted", { id });
  res.json({ success: true });
});

export default router;

// Handles all Issue CRUD operations. Each route:
// 1. Runs requireOrg middleware first (checks login + org membership)
// 2. Does the DB operation via Prisma
// 3. Writes an AuditLog row for every mutation
// 4. Broadcasts the change to all workspace members via Socket.io
// 5. Returns the result

// GET / → fetch all non-deleted issues for the org
// POST / → create issue, audit log it, broadcast issue:created
// PATCH /:id → partial update (only update fields that were sent, not entire object)
// DELETE /:id → soft delete (sets deletedAt, row stays in DB), broadcast issue:deleted
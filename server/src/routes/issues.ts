import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireOrg } from "../middleware/requireOrg.js";

const router = Router();

router.get("/", requireOrg, async (req, res) => {
  const issues = await prisma.issue.findMany({
    where: {
      organizationId: req.organizationId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(issues);
});

router.post("/", requireOrg, async (req, res) => {
  const { title, description, priority, assigneeId } = req.body;

  if (!title?.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const issue = await prisma.issue.create({
    data: {
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

  res.json({ success: true });
});

export default router;
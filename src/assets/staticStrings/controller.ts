export const controllerString = `
import { Prisma } from ".prisma/client";
import { Request, Response } from "express";
import prisma from "~/lib/prisma";

export const handleCreateEntity = async (req: Request, res: Response) => {
    const { title, token, product } = req.body;

    const productToBeConnected = await prisma.product.findUnique({
      where: { id: product },
    });

    if (!productToBeConnected)
      return res.status(400).json({ data: "Product not found" });

    const newGroupObject = {
      title,
      token,
      product: { connect: { id: product } },
    };
    const group = await prisma.group.create({
      data: newGroupObject,
    });
    return res.json({ data: group });
};

export const handleDeleteEntity = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const groupId = Number(req.params.id);
  if (!groupId) return res.status(400).json({ data: "Invalid ID" });

  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) return res.status(404).json({ data: "Group Not Found" });

  await prisma.group.delete({
    where: {
      id: groupId,
    },
  });

  return res.status(200).json({ data: "Successfully Deleted!" });
};

export const handleGetAllEntities = async (req: Request, res: Response) => {
  const skip = Number(req.query.skip) || 0;
  const take = Number(req.query.take) || 10;

  const groups = await prisma.group.findMany({
    skip: skip,
    take: take,
  });

  return res.json({ data: groups });
};

export const handleGetEntityById = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const groupId = Number(req.params.id);
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });
  return res.json({ data: group });
};

export const handle = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const groupId = Number(req.params.id);
  const allowedUpdateFields: Array<keyof Prisma.GroupUpdateInput> = [
    "title",
    "token",
  ];

  const updates = Object.keys(req.body);

  const updateObject: Prisma.GroupUpdateInput = {};

  for (const update of updates) {
    if (!allowedUpdateFields.includes(update as keyof Prisma.GroupUpdateInput))
      return res.status(400).json({ data: "Invalid Arguments" });
    else updateObject[update] = req.body[update];
  }

  const groupToBeUpdated = await prisma.group.findUnique({
    where: { id: groupId },
  });
  if (!groupToBeUpdated)
    return res.status(404).json({ data: "Group Not Found" });
  const group = await prisma.group.update({
    where: {
      id: groupId,
    },
    data: updateObject,
  });

  return res.json({ data: group });
};
`;

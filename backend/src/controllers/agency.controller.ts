import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const updateAgencySchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

export const getAgency = async (req: AuthRequest, res: Response) => {
  if (!req.user?.agencyId) {
    throw new AppError(404, 'No agency found');
  }

  const agency = await prisma.agency.findUnique({
    where: { id: req.user.agencyId },
    include: {
      _count: {
        select: {
          clients: true,
          components: true,
          users: true,
        },
      },
    },
  });

  if (!agency) {
    throw new AppError(404, 'Agency not found');
  }

  res.json(agency);
};

export const updateAgency = async (req: AuthRequest, res: Response) => {
  if (!req.user?.agencyId) {
    throw new AppError(404, 'No agency found');
  }

  if (req.user.role !== 'AGENCY_ADMIN') {
    throw new AppError(403, 'Only agency admins can update agency details');
  }

  const data = updateAgencySchema.parse(req.body);

  const agency = await prisma.agency.update({
    where: { id: req.user.agencyId },
    data,
  });

  res.json(agency);
};

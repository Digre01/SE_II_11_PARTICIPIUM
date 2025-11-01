import { Router } from "express";
import { createTicket, nextCustomerByServiceIds } from "../controllers/queueController.mjs";

const router = Router();

// POST /api/v1/tickets
router.post('/tickets', async (req, res, next) => {
  try {
    const { serviceId } = req.body;
    if (!serviceId) {
      return res.status(400).json({ error: "serviceId is required" });
    }
    res.status(201).json(await createTicket(serviceId));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/tickets/next
router.post('/tickets/next', async (req, res, next) => {
  try {
    const { serviceIds } = req.body;
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ error: "serviceIds is required (array)" });
    }
    const ticket = await nextCustomerByServiceIds(serviceIds);
    if (!ticket) {
      return res.status(204).send(); // No Content
    }
    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
});

export default router;

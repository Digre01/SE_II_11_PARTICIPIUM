import { exampleRepository } from "../repositories/exampleRepository.mjs";

export async function createTicket(serviceId) {
  if (!serviceId) throw new Error("serviceId is required");
  const ticket = await queueRepository.createTicket(serviceId);
  return ticket;
}

export async function nextCustomerByServiceIds(serviceIds) {
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) throw new Error("serviceIds is required");
  const ticket = await queueRepository.nextCustomerByServiceIds(serviceIds);
  return ticket;
}
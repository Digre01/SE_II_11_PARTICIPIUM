import { AppDataSourcePostgres } from "../config/data-source.js";
import { Queue } from "../entities/Example.js";
import { Service } from "../entities/Service.js";

export class QueueRepository {
	get repo() {
		return AppDataSourcePostgres.getRepository(Queue);
	}

	async createTicket(serviceId) {
		const count = await this.repo.count({ where: { serviceId } });
		const progressiveNumber = count + 1;
		const listCode = `S${serviceId}-${progressiveNumber}`;
		const entity = this.repo.create({ serviceId, ticket: listCode });
		const saved = await this.repo.save(entity);
		return { id: saved.id, listCode };
	}

	/**
	 * Trova e rimuove il prossimo ticket da servire tra i servizi passati (array di serviceId)
	 * Regole:
	 * - seleziona il ticket più vecchio dalla coda più lunga
	 * - in caso di parità, seleziona la coda con avgTime minore
	 * - se tutte le code sono vuote, restituisce null
	 */
	async nextCustomerByServiceIds(serviceIds) {
		if (!Array.isArray(serviceIds) || serviceIds.length === 0) return null;
		// Ottieni le code per ogni serviceId
		const queues = await Promise.all(
			serviceIds.map(async (sid) => {
				const q = await this.repo.find({ where: { serviceId: sid }, order: { id: "ASC" } });
				return { serviceId: sid, queue: q };
			})
		);
		// Trova la coda più lunga
		let maxLen = Math.max(...queues.map(q => q.queue.length));
		if (maxLen === 0) return null; // tutte vuote
		// Filtra le code più lunghe
		let longestQueues = queues.filter(q => q.queue.length === maxLen);
		// Se più code hanno la stessa lunghezza, scegli quella con avgTime minore
		if (longestQueues.length > 1) {
			// Ottieni avgTime per ciascun serviceId
			const services = await AppDataSourcePostgres.getRepository(Service).findByIds(longestQueues.map(q => q.serviceId));
			const minAvgTime = Math.min(...services.map(s => s.avgTime));
			const bestServiceIds = services.filter(s => s.avgTime === minAvgTime).map(s => s.serviceId.toString());
			longestQueues = longestQueues.filter(q => bestServiceIds.includes(q.serviceId.toString()));
		}
		// Prendi il ticket più vecchio dalla coda selezionata
		const selectedQueue = longestQueues[0];
		const nextTicket = selectedQueue.queue[0];
		if (!nextTicket) return null;
		// Rimuovi il ticket dalla coda
		await this.repo.delete(nextTicket.id);
		return nextTicket;
	}
}

export const queueRepository = new QueueRepository();

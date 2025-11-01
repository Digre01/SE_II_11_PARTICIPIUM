import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// Prepare a repository stub with the methods used by QueueRepository
const repoStub = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
};

// Mock the data-source module BEFORE importing the repository under test
await jest.unstable_mockModule("../../config/data-source.js", () => {
    return {
        AppDataSourcePostgres: {
            getRepository: jest.fn(() => repoStub),
        },
    };
});

// Now import the repository under test (it will see the mocked data-source)
const { queueRepository } = await import("../../repositories/queueRepository.mjs");

describe("QueueRepository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createTicket", () => {
        it("should create and save a new ticket", async () => {
            const serviceId = 1;
            // Simulate there are already 2 tickets for this service
            repoStub.count.mockResolvedValue(2);
            repoStub.create.mockReturnValue({ serviceId, ticket: "S1-3" });
            repoStub.save.mockResolvedValue({ id: 123, serviceId, ticket: "S1-3" });

            const result = await queueRepository.createTicket(serviceId);

            expect(repoStub.count).toHaveBeenCalledWith({ where: { serviceId } });
            expect(repoStub.create).toHaveBeenCalledWith({ serviceId, ticket: "S1-3" });
            expect(repoStub.save).toHaveBeenCalledWith({ serviceId, ticket: "S1-3" });
            expect(result).toEqual({ id: 123, listCode: "S1-3" });
        });
    });

    
    describe("nextCustomerByServiceIds with empty queue", () => {
        it("should return null if serviceIds is not an array or empty", async () => {
            let result = await queueRepository.nextCustomerByServiceIds(null);
            expect(result).toBeNull();
            result = await queueRepository.nextCustomerByServiceIds([]);
            expect(result).toBeNull();
        });
    });
    
    describe("nextCustomerByServiceIds with non-empty queues", () => {
        beforeEach(() => {
            // Reset the repoStub methods
            jest.clearAllMocks();
        });
        it("should return the next ticket from the longest queue", async () => {
            // Mock the repo.find method to return different queues
            repoStub.find = jest.fn().mockResolvedValueOnce([{ id: 1, serviceId: 1, ticket: "S1-1" }])
            .mockResolvedValueOnce([{ id: 2, serviceId: 2, ticket: "S2-1" }, { id: 3, serviceId: 2, ticket: "S2-2" }])
            .mockResolvedValueOnce([{ id: 4, serviceId: 3, ticket: "S3-1" }]);
            repoStub.delete = jest.fn().mockResolvedValue(true);

            const result = await queueRepository.nextCustomerByServiceIds([1, 2, 3]);
            expect(result).toEqual({ id: 2, serviceId: 2, ticket: "S2-1" });
            expect(repoStub.find).toHaveBeenCalledTimes(3);
            expect(repoStub.delete).toHaveBeenCalledWith(2);
        });
    });
});
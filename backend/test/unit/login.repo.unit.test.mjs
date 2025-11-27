import {describe, it, expect, beforeEach, jest } from "@jest/globals";


const repoStub = {
    findOneBy: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
};

await jest.unstable_mockModule("../../config/data-source.js", () => {
    return {
        AppDataSourcePostgres: {
            getRepository: jest.fn(() => repoStub),
        },
    };
});

const { userRepository } = await import("../../repositories/userRepository.js");

describe("User Repository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createUser", () => {
        it("should create and save a new user", async () => {
            const userData = { username: "testuser", email: "testuser@example.com", name: "Test", surname: "User", password: "password123", salt: "randomsalt", userType: "citizen" };
            // no conflicts
            repoStub.findOneBy
                .mockResolvedValueOnce(null) // username check
                .mockResolvedValueOnce(null); // email check
            repoStub.save.mockResolvedValue({ id: 1, ...userData });

            const result = await userRepository.createUser(...Object.values(userData));
            
            expect(repoStub.findOneBy).toHaveBeenNthCalledWith(1, { username: userData.username });
            expect(repoStub.findOneBy).toHaveBeenNthCalledWith(2, { email: userData.email });
            expect(repoStub.save).toHaveBeenCalledWith(userData);
            expect(result).toEqual({ id: 1, ...userData });
        });
    });

    describe("createUser with existing username", () => {
        it("should throw ConflictError if username already exists", async () => {
            const userData = { username: "existinguser", email: "existinguser@example.com", name: "Existing", surname: "User", password: "password123", salt: "randomsalt", userType: "citizen" };
            // first check (username) returns an existing user
            repoStub.findOneBy.mockResolvedValueOnce(userData);
            await expect(userRepository.createUser(...Object.values(userData))).rejects.toThrow("User with username existinguser already exists");
        });
    });

    describe("createUser with existing email", () => {
        it("should throw ConflictError if email already exists", async () => {
            const userData = { 
                username: "newuser",
                email: "existinguser@example.com",
                name: "New",
                surname: "User",
                password: "password123",
                salt: "randomsalt",
                userType: "citizen"
            };
            // username ok -> null, email already used -> user
            repoStub.findOneBy
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(userData);
            await expect(userRepository.createUser(...Object.values(userData))).rejects.toThrow("User with email existinguser@example.com already exists");
        });
    });

    describe("getUserById", () => {
        it("should return user by ID", async () => {
            const user = { id: 1, username: "testuser" };
            repoStub.findOneBy.mockResolvedValueOnce(user);
            const result = await userRepository.getUserById(1);
            expect(repoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
            expect(result).toEqual(user);
        });
    });

    describe("getUserByUsername", () => {
        it("should return user by username", async () => {
            const user = { id: 1, username: "testuser" };
            repoStub.findOneBy.mockResolvedValueOnce(user);
            const result = await userRepository.getUserByUsername("testuser");
            expect(repoStub.findOneBy).toHaveBeenCalledWith({ username: "testuser" });
            expect(result).toEqual(user);
        });
    });

});

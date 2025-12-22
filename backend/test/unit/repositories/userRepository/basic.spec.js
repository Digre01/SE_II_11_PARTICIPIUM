import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { userRepoStub, userOfficeRepoStub } from "../../mocks/shared.mocks.js";
import { resetUserRepositoryMocks } from "./userRepository.setup.js";

const { userRepository } = await import("../../../../repositories/userRepository.js");

beforeEach(() => {
    jest.clearAllMocks();
    resetUserRepositoryMocks();
});

describe("Fetching users", () => {

    it("getUserById returns user", async () => {
        const result = await userRepository.getUserById(1);

        expect(userRepoStub.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
            relations: ["userOffice", "userOffice.role"],
        });
        expect(result).toEqual({ id: 1 });
    });

    it("getUserByUsername returns user", async () => {
        const result = await userRepository.getUserByUsername("foo");

        expect(userRepoStub.findOne).toHaveBeenCalledWith({
            where: { username: "foo" },
            relations: ["userOffice", "userOffice.role"],
        });
        expect(result).toEqual({ id: 1 });
    });

    it("getUserByEmail returns user", async () => {

        const result = await userRepository.getUserByEmail("bar@baz.com");

        expect(userRepoStub.findOne).toHaveBeenCalledWith({
            where: { email: "bar@baz.com" },
            relations: ["userOffice", "userOffice.role"],
        });
        expect(result).toEqual({ id: 1 });
    });
});

describe("User creation (citizen)", () => {
    it("creates a new user when no conflicts", async () => {
        userRepoStub.findOneBy
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);

        const result = await userRepository.createUser(
            "user",
            "user@mail.com",
            "Nome",
            "Cognome",
            "pw",
            "salt",
            "CITIZEN"
        );

        expect(result).toHaveProperty("id");
    });

    it("throws ConflictError if username exists", async () => {
        userRepoStub.findOneBy.mockResolvedValueOnce({ id: 1 });

        await expect(
            userRepository.createUser("u", "e", "n", "s", "p", "salt", "CITIZEN")
        ).rejects.toThrow("User with username u already exists");
    });

    it("throws ConflictError if email exists", async () => {
        userRepoStub.findOneBy
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ id: 2 });

        await expect(
            userRepository.createUser("u", "e", "n", "s", "p", "salt", "CITIZEN")
        ).rejects.toThrow("User with email e already exists");
    });
});

describe("UserRepository.deleteUser", () => {
    it("deletes user and mapping", async () => {
        const result = await userRepository.deleteUser(1);

        expect(userOfficeRepoStub.delete).toHaveBeenCalledWith({ userId: 1 });
        expect(userRepoStub.delete).toHaveBeenCalledWith({ id: 1  });
        expect(result).toEqual({ id: 1 });
    });

    it("deleteUser deletes user if no mapping", async () => {
        userOfficeRepoStub.findOneBy.mockResolvedValue(null);

        const result = await userRepository.deleteUser(1);

        expect(userOfficeRepoStub.delete).not.toHaveBeenCalled();
        expect(userRepoStub.delete).toHaveBeenCalledWith({ id: 1 });
        expect(result).toEqual({ id: 1 });
    });

    it("throws if user not found", async () => {
        userRepoStub.findOneBy.mockResolvedValue(null);

        await expect(userRepository.deleteUser(999)).rejects.toThrow("User with id '999' not found");
    });
});

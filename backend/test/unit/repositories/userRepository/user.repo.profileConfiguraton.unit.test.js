import { describe, it, beforeEach, jest, expect } from "@jest/globals";
import { resetUserRepositoryMocks } from "./userRepository.setup.js";
import { photoRepoStub, userRepoStub } from "../../mocks/repo.stubs.js";

const { userRepository } = await import("../../../../repositories/userRepository.js");

describe("UserRepository profile configuration", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        resetUserRepositoryMocks();
    });


    it("throws if user not found", async () => {
        userRepoStub.findOneBy.mockResolvedValue(null);

        await expect(
            userRepository.configUserAccount(999, "tg", true, "url")
        ).rejects.toThrow("User with id '999' not found");
    });

    it("getPfpUrl returns photo url", async () => {
        const user = { id: 9, photoId: 2 };
        userRepoStub.findOneBy.mockResolvedValue(user);
        photoRepoStub.findOneBy.mockResolvedValue({ id: 2, link: "pfpurl" });

        const result = await userRepository.getPfpUrl(9);

        expect(result).toBe("pfpurl");
    });

    it("getPfpUrl throws if photo missing", async () => {
        const user = { id: 10 };
        userRepoStub.findOneBy.mockResolvedValue(user);
        photoRepoStub.findOneBy.mockResolvedValue(null);

        await expect(
            userRepository.getPfpUrl(10)
        ).rejects.toThrow("'10' profile picture not found");
    });
});

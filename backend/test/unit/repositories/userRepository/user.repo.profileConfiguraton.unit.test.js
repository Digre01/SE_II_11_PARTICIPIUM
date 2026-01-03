import { describe, it, beforeEach, jest, expect } from "@jest/globals";
import { resetUserRepositoryMocks } from "./userRepository.setup.js";
import { photoRepoStub, userRepoStub } from "../../mocks/repo.stubs.js";

const { userRepository } = await import("../../../../repositories/userRepository.js");

describe("UserRepository profile configuration", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        resetUserRepositoryMocks();
    });

    it("configUserAccount updates telegramId, emailNotifications and photo", async () => {
        const user = { id: 8 };
        userRepoStub.findOneBy.mockResolvedValue(user);
        userRepoStub.save.mockResolvedValue({
            ...user,
            telegramId: "tg",
            emailNotifications: true,
            photoId: 1
        });

        photoRepoStub.create.mockReturnValue({ link: "url" });
        photoRepoStub.save.mockResolvedValue({ id: 1 });

        const result = await userRepository.configUserAccount(8, "tg", true, "url");

        expect(photoRepoStub.create).toHaveBeenCalledWith({ link: "url" });
        expect(photoRepoStub.save).toHaveBeenCalledWith({ link: "url" });
        expect(userRepoStub.save).toHaveBeenCalledWith(
            expect.objectContaining({ telegramId: "tg", emailNotifications: true, photoId: 1 })
        );
        expect(result.telegramId).toBe("tg");
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

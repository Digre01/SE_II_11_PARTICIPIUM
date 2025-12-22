import {describe, expect, it} from "@jest/globals";
import {photoRepoStub, userRepoStub} from "../../mocks/reports.mock.js";

const { userRepository } = await import("../../../../repositories/userRepository.js");

describe("UserRepository profile configuration", () => {

    it("configUserAccount updates telegramId, emailNotifications and photo", async () => {
        userRepoStub.findOneBy.mockResolvedValue({ id: 8 });
        userRepoStub.save.mockResolvedValue({
            id: 8,
            telegramId: "tg",
            emailNotifications: true,
            photoId: 1
        });

        photoRepoStub.create.mockReturnValue({ link: "url" });
        photoRepoStub.save.mockResolvedValue({ id: 1 });

        const result = await userRepository.configUserAccount(8, "tg", true, "url");

        expect(photoRepoStub.create).toHaveBeenCalledWith({ link: "url" });
        expect(userRepoStub.save).toHaveBeenCalled();
        expect(result.telegramId).toBe("tg");
    });

    it("throws if user not found", async () => {
        userRepoStub.findOneBy.mockResolvedValue(null);

        await expect(
            userRepository.configUserAccount(999, "tg", true, "url")
        ).rejects.toThrow("User with id '999' not found");
    });

    it("getPfpUrl returns photo url", async () => {
        userRepoStub.findOneBy.mockResolvedValue({ id: 9, photoId: 2 });
        photoRepoStub.findOneBy.mockResolvedValue({ link: "pfpurl" });

        const result = await userRepository.getPfpUrl(9);

        expect(result).toBe("pfpurl");
    });

    it("getPfpUrl throws if photo missing", async () => {
        userRepoStub.findOneBy.mockResolvedValue({ id: 10 });

        await expect(
            userRepository.getPfpUrl(10)
        ).rejects.toThrow("'10' profile picture not found");
    });
});

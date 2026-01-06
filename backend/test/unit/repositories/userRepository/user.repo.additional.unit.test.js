import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
    userRepoStub,
    rolesRepoStub,
    officeRepoStub,
    userOfficeRepoStub,
    photoRepoStub
} from "../../mocks/repo.stubs.js";
import { resetUserRepositoryMocks } from "./userRepository.setup.js";

const { userRepository } = await import("../../../../repositories/userRepository.js");

describe("UserRepository additional coverage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetUserRepositoryMocks();
    });

    it("getUserRoles returns role-office pairs", async () => {
        userRepoStub.findOne.mockResolvedValueOnce({
            id: 1,
            userOffice: [{ role: { id: 10 }, office: { id: 20 } }]
        });

        const result = await userRepository.getUserRoles(1);

        expect(result).toEqual([{ role: { id: 10 }, office: { id: 20 } }]);
    });

    it("getUserRoles throws when userId is falsy", async () => {
        await expect(userRepository.getUserRoles(undefined)).rejects.toThrow(
            "User with id 'undefined' not found"
        );
    });

    it("setUserRoles rejects non-staff users", async () => {
        userRepoStub.findOneBy.mockResolvedValueOnce({ id: 1, userType: "citizen" });

        await expect(userRepository.setUserRoles(1, [])).rejects.toThrow(
            "Only staff accounts can be assigned roles"
        );
    });

    it("setUserRoles rejects non-array roles", async () => {
        await expect(userRepository.setUserRoles(1, null)).rejects.toThrow(
            "roles must be an array of { roleId, isExternal? }"
        );
    });

    it("setUserRoles throws when office is missing", async () => {
        userOfficeRepoStub.find.mockResolvedValueOnce([]);
        rolesRepoStub.findOneBy.mockResolvedValueOnce({ id: 5, officeId: 99 });
        officeRepoStub.findOneBy.mockResolvedValueOnce(null);

        await expect(userRepository.setUserRoles(1, [{ roleId: 5 }])).rejects.toThrow(
            "Office with id '99' not found"
        );
    });

    it("assignRoleToUser throws when user not found", async () => {
        userRepoStub.findOneBy.mockResolvedValueOnce(null);

        await expect(userRepository.assignRoleToUser(999, 1)).rejects.toThrow(
            "User with id '999' not found"
        );
    });

    it("configUserAccount throws on telegram conflict", async () => {
        userRepoStub.findOneBy.mockResolvedValueOnce({ id: 1 });
        userRepoStub.findOne.mockResolvedValueOnce({ id: 2 });

        await expect(
            userRepository.configUserAccount(1, "dup", undefined, undefined)
        ).rejects.toThrow("Telegram ID already in use");
    });

    it("configUserAccount updates telegram, emailNotifications and photo", async () => {
        userRepoStub.findOneBy.mockResolvedValueOnce({ id: 1 });
        userRepoStub.findOne.mockResolvedValueOnce(null);
        photoRepoStub.create.mockReturnValue({ link: "photo" });
        photoRepoStub.save.mockResolvedValue({ id: 10, link: "photo" });

        await userRepository.configUserAccount(1, "tg", true, "photo");

        expect(userRepoStub.save).toHaveBeenCalledWith(
            expect.objectContaining({ telegramId: "tg", emailNotifications: true, photoId: 10 })
        );
    });

    it("requestTelegramVerificationCode throws if telegramId missing", async () => {
        userRepoStub.findOneBy.mockResolvedValueOnce({ id: 1, telegramId: null });

        await expect(userRepository.requestTelegramVerificationCode(1)).rejects.toThrow(
            "TelegramId is required"
        );
    });

    it("verifyTelegramCode throws when expired and clears code", async () => {
        const expiredUser = {
            id: 1,
            telegramVerificationCode: "123456",
            telegramId: "user",
            telegramVerificationExpires: new Date(Date.now() - 1000)
        };
        userRepoStub.findOne.mockResolvedValueOnce(expiredUser);

        await expect(userRepository.verifyTelegramCode("user", "123456")).rejects.toThrow(
            "Verification code expired"
        );
        expect(userRepoStub.save).toHaveBeenCalledWith(
            expect.objectContaining({ telegramVerificationCode: null, telegramVerificationExpires: null })
        );
    });

    it("getPfpUrl throws when user not found", async () => {
        userRepoStub.findOneBy.mockResolvedValueOnce(null);

        await expect(userRepository.getPfpUrl(42)).rejects.toThrow(
            "User with id '42' not found"
        );
    });

    it("getPfpUrl throws when profile picture is missing", async () => {
        userRepoStub.findOneBy.mockResolvedValueOnce({ id: 1, photoId: null });

        await expect(userRepository.getPfpUrl(1)).rejects.toThrow(
            "'1' profile picture not found"
        );
    });

    it("getPfpUrl throws when photo entity does not exist", async () => {
        userRepoStub.findOneBy.mockResolvedValueOnce({ id: 1, photoId: 7 });
        photoRepoStub.findOneBy.mockResolvedValueOnce(null);

        await expect(userRepository.getPfpUrl(1)).rejects.toThrow(
            "'1' profile picture not found"
        );
    });

    it("saveEmailVerificationCode stores code and expiry", async () => {
        const expiresAt = new Date();
        userRepoStub.findOneBy.mockResolvedValueOnce({ id: 1 });

        await userRepository.saveEmailVerificationCode(1, "abc", expiresAt);

        expect(userRepoStub.save).toHaveBeenCalledWith(
            expect.objectContaining({ verificationCode: "abc", verificationCodeExpires: expiresAt })
        );
    });

    it("getEmailVerification returns stored values", async () => {
        const expiresAt = new Date();
        userRepoStub.findOneBy.mockResolvedValueOnce({
            id: 1,
            verificationCode: "xyz",
            verificationCodeExpires: expiresAt
        });

        const result = await userRepository.getEmailVerification(1);

        expect(result).toEqual({ code: "xyz", expiresAt });
    });

    it("markEmailVerified flags user as verified", async () => {
        const user = { id: 1, isVerified: false, verificationCode: "a", verificationCodeExpires: new Date() };
        userRepoStub.findOneBy.mockResolvedValueOnce(user);

        await userRepository.markEmailVerified(1);

        expect(userRepoStub.save).toHaveBeenCalledWith(
            expect.objectContaining({ isVerified: true, verificationCode: null, verificationCodeExpires: null })
        );
    });
});

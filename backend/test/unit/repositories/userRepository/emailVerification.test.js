import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { resetUserRepositoryMocks } from "./userRepository.setup.js";
import {userRepoStub} from "../../mocks/shared.mocks.js";


const { userRepository } = await import("../../../../repositories/userRepository.js");

describe("Email verification functions", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        resetUserRepositoryMocks();
    });

    it("saveEmailVerificationCode saves code and expiry", async () => {
        const user = { id: 1 };
        userRepoStub.findOneBy.mockResolvedValue(user);
        userRepoStub.save.mockResolvedValue({ ...user, verificationCode: "abc", verificationCodeExpires: 123 });

        await expect(userRepository.saveEmailVerificationCode(1, "abc", 123)).resolves.toBeUndefined();
        expect(userRepoStub.save).toHaveBeenCalledWith(
            expect.objectContaining({ verificationCode: "abc", verificationCodeExpires: 123 })
        );
    });

    it("saveEmailVerificationCode throws if user not found", async () => {
        userRepoStub.findOneBy.mockResolvedValue(null);
        await expect(userRepository.saveEmailVerificationCode(999, "abc", 123))
            .rejects.toThrow("User with id '999' not found");
    });

    it("getEmailVerification returns code and expiry", async () => {
        userRepoStub.findOneBy.mockResolvedValue({ id: 1, verificationCode: "xyz", verificationCodeExpires: 456 });

        const result = await userRepository.getEmailVerification(1);
        expect(result).toEqual({ code: "xyz", expiresAt: 456 });
    });

    it("getEmailVerification returns nulls if not set", async () => {
        userRepoStub.findOneBy.mockResolvedValue({ id: 1 });

        const result = await userRepository.getEmailVerification(1);
        expect(result).toEqual({ code: null, expiresAt: null });
    });

    it("getEmailVerification throws if user not found", async () => {
        userRepoStub.findOneBy.mockResolvedValue(null);
        await expect(userRepository.getEmailVerification(999))
            .rejects.toThrow("User with id '999' not found");
    });

    it("markEmailVerified sets isVerified and clears code", async () => {
        const user = { id: 1, verificationCode: "abc", verificationCodeExpires: 123 };
        userRepoStub.findOneBy.mockResolvedValue(user);
        userRepoStub.save.mockResolvedValue({ ...user, isVerified: true, verificationCode: null, verificationCodeExpires: null });

        await expect(userRepository.markEmailVerified(1)).resolves.toBeUndefined();
        expect(userRepoStub.save).toHaveBeenCalledWith(
            expect.objectContaining({ isVerified: true, verificationCode: null, verificationCodeExpires: null })
        );
    });

    it("markEmailVerified throws if user not found", async () => {
        userRepoStub.findOneBy.mockResolvedValue(null);
        await expect(userRepository.markEmailVerified(999))
            .rejects.toThrow("User with id '999' not found");
    });
});

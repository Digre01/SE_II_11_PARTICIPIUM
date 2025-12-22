import {
    userRepoStub,
    rolesRepoStub,
    officeRepoStub,
    userOfficeRepoStub
} from "../../mocks/shared.mocks.js";

export const resetUserRepositoryMocks = () => {
    userRepoStub.findOneBy.mockResolvedValue({ id: 1, userType: 'STAFF' });
    userRepoStub.findOne.mockResolvedValue({ id: 1, userType: 'STAFF' });

    officeRepoStub.findOneBy.mockResolvedValue({ id: 1 });
    rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: 1 });

    userOfficeRepoStub.create.mockReturnValue({
        userId: 1,
        officeId: 1,
        roleId: 1,
    });

    userRepoStub.save.mockImplementation(async (entity) => ({ ...entity, id: 1 }));
    userOfficeRepoStub.findOne.mockResolvedValue({
        userId: 1,
        office: { id: 1 },
        role: { id: 1 },
    });
    userOfficeRepoStub.findOneBy.mockResolvedValue({
        userId: 1,
        office: { id: 1 },
        role: { id: 1 },
    });

    userRepoStub.delete.mockResolvedValue({ id: 1 });
    userOfficeRepoStub.delete.mockResolvedValue({ id: 1 });
};

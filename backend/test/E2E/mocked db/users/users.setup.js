import {standardSetup} from "../../utils/standard.setup.js";

export async function setupUsers() {
    const base = await standardSetup();

    const { userRepository } =
        await import('../../../../repositories/userRepository.js');

    const { rolesRepository } =
        await import('../../../../repositories/rolesRepository.js');

    const { default: userService } =
        await import('../../../../services/userService.js');

    return {
        ...base,
        userRepository,
        rolesRepository,
        userService,
    };
}

export async function cleanupUsers(dataSource, userRepository, usernames = []) {
    for (const username of usernames) {
        const user = await userRepository.getUserByUsername(username);

        if (user) {
            const userOfficeRepo = dataSource.getRepository('UserOffice');
            await userOfficeRepo.delete({ userId: user.id });
            await userRepository.repo.delete({ id: user.id });
        }
    }
}

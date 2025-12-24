export async function cleanupUsers(dataSource, usernames = []) {
    const userRepo = dataSource.getRepository('Users');
    const userOfficeRepo = dataSource.getRepository('UserOffice');

    for (const username of usernames) {
        const user = await userRepo.findOneBy({ username });
        if (user) {
            await userOfficeRepo.delete({ userId: user.id });
            await userRepo.delete({ id: user.id });
        }
    }
}

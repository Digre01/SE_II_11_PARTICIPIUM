export function mapUserToDTO(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        surname: user.surname,
        userType: user.userType,
        // user.userOffice may be an array (multiple roles) — pick the first mapping for backward compatibility
        officeId: (Array.isArray(user.userOffice) ? (user.userOffice[0] ?? null) : user.userOffice) ? ((Array.isArray(user.userOffice) ? (user.userOffice[0] ?? null) : user.userOffice).officeId ?? null) : null,
        roleId: (Array.isArray(user.userOffice) ? (user.userOffice[0] ?? null) : user.userOffice) ? ((Array.isArray(user.userOffice) ? (user.userOffice[0] ?? null) : user.userOffice).roleId ?? null) : null,
        roleName: (() => {
            const uo = Array.isArray(user.userOffice) ? (user.userOffice[0] ?? null) : user.userOffice;
            return uo && uo.role ? (uo.role.name ?? null) : null;
        })(),
        telegramId: user.telegramId ?? null,
        emailNotifications: user.emailNotifications ?? null,
    }
}
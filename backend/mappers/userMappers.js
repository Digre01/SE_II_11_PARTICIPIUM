export function mapUserToDTO(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        surname: user.surname,
        userType: user.userType,
        officeId: user.userOffice ? (user.userOffice.officeId ?? null) : null,
        roleId: user.userOffice ? (user.userOffice.roleId ?? null) : null
    }
}
import { mapUserToDTO } from '../../mappers/userMappers.js';

describe('mapUserToDTO', () => {
  it('maps user with single userOffice and role', () => {
    const user = {
      id: 1,
      username: 'test',
      email: 'test@example.com',
      name: 'Test',
      surname: 'User',
      userType: 'ADMIN',
      isVerified: true,
      userOffice: {
        officeId: 10,
        roleId: 5,
        role: { name: 'Manager' }
      },
      telegramId: 'tg123',
      emailNotifications: true
    };
    expect(mapUserToDTO(user)).toEqual({
      id: 1,
      username: 'test',
      email: 'test@example.com',
      name: 'Test',
      surname: 'User',
      userType: 'ADMIN',
      isVerified: true,
      officeId: [10],
      roleId: 5,
      roleName: 'Manager',
      telegramId: 'tg123',
      emailNotifications: true
    });
  });

  it('maps user with multiple userOffice', () => {
    const user = {
      id: 2,
      username: 'multi',
      email: 'multi@example.com',
      name: 'Multi',
      surname: 'User',
      userType: 'STAFF',
      isVerified: false,
      userOffice: [
        { officeId: 20, roleId: 7, role: { name: 'Staff' } },
        { officeId: 21, roleId: 8, role: { name: 'Other' } }
      ],
      telegramId: undefined,
      emailNotifications: undefined
    };
    expect(mapUserToDTO(user)).toEqual({
      id: 2,
      username: 'multi',
      email: 'multi@example.com',
      name: 'Multi',
      surname: 'User',
      userType: 'STAFF',
      isVerified: false,
      officeId: [20, 21],
      roleId: 7,
      roleName: 'Staff',
      telegramId: null,
      emailNotifications: null
    });
  });

  it('maps user with no userOffice', () => {
    const user = {
      id: 3,
      username: 'nouseroffice',
      email: 'no@example.com',
      name: 'No',
      surname: 'Office',
      userType: 'CITIZEN',
      isVerified: false
    };
    expect(mapUserToDTO(user)).toEqual({
      id: 3,
      username: 'nouseroffice',
      email: 'no@example.com',
      name: 'No',
      surname: 'Office',
      userType: 'CITIZEN',
      isVerified: false,
      officeId: null,
      roleId: null,
      roleName: null,
      telegramId: null,
      emailNotifications: null
    });
  });

  it('maps user with userOffice but no role', () => {
    const user = {
      id: 4,
      username: 'norole',
      email: 'norole@example.com',
      name: 'No',
      surname: 'Role',
      userType: 'STAFF',
      isVerified: true,
      userOffice: { officeId: 30, roleId: null, role: null }
    };
    expect(mapUserToDTO(user)).toEqual({
      id: 4,
      username: 'norole',
      email: 'norole@example.com',
      name: 'No',
      surname: 'Role',
      userType: 'STAFF',
      isVerified: true,
      officeId: [30],
      roleId: null,
      roleName: null,
      telegramId: null,
      emailNotifications: null
    });
  });
});

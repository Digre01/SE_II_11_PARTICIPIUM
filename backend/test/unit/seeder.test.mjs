import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Shared mock state for repositories
const makeState = () => ({
  offices: [],
  categories: [],
  users: [],
  roles: [],
});

let state;
let officeRepo, categoryRepo, userRepo, rolesRepo;
let getRepository;

function buildRepos() {
  // Helper to assign incremental ids on save
  const assignWithIds = (arr, store) => {
    const start = store.length + 1;
    const withIds = arr.map((o, i) => ({ id: start + i, ...o }));
    store.push(...withIds);
    return withIds;
  };

  officeRepo = {
    find: jest.fn(async () => [...state.offices]),
    save: jest.fn(async (arr) => assignWithIds(arr, state.offices)),
  };
  categoryRepo = {
    find: jest.fn(async () => [...state.categories]),
    save: jest.fn(async (arr) => assignWithIds(arr, state.categories)),
  };
  userRepo = {
    find: jest.fn(async () => [...state.users]),
    save: jest.fn(async (arr) => assignWithIds(arr, state.users)),
  };
  rolesRepo = {
    find: jest.fn(async () => [...state.roles]),
    save: jest.fn(async (arr) => assignWithIds(arr, state.roles)),
  };

  getRepository = jest.fn((entity) => {
    const name = entity?.options?.name || entity?.options?.tableName || entity?.name;
    switch (name) {
      case 'Offices':
        return officeRepo;
      case 'Categories':
        return categoryRepo;
      case 'Users':
        return userRepo;
      case 'Roles':
        return rolesRepo;
      default:
        throw new Error(`Unknown entity ${name}`);
    }
  });
}

// Mock the TypeORM DataSource used by the seeder BEFORE importing it
await jest.unstable_mockModule('../../config/data-source.js', () => ({
  AppDataSourcePostgres: {
    getRepository: (...args) => getRepository(...args),
  },
}));

// Import after mocks
const { seedDatabase } = await import('../../database/seeder.js');

describe('database/seeder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    state = makeState();
    buildRepos();
  });

  it('seeds all tables when empty', async () => {
    // Initially all repos empty
    await seedDatabase();

    // Offices: saved once with 10 entries, and find called at least twice (before and after save)
    expect(officeRepo.save).toHaveBeenCalledTimes(1);
    const officesArg = officeRepo.save.mock.calls[0][0];
    expect(Array.isArray(officesArg)).toBe(true);
    expect(officesArg).toHaveLength(10);

    // After save, find should contain ids
    expect(state.offices.length).toBe(10);
    state.offices.forEach((o) => expect(o.id).toBeGreaterThan(0));

    // Categories seeded (9)
    expect(categoryRepo.save).toHaveBeenCalledTimes(1);
    const categoriesArg = categoryRepo.save.mock.calls[0][0];
    expect(categoriesArg).toHaveLength(9);
    // Each category should reference an officeId > 0
    categoriesArg.forEach((c) => expect(c.officeId).toBeGreaterThan(0));

    // Users seeded (5)
    expect(userRepo.save).toHaveBeenCalledTimes(1);
    const usersArg = userRepo.save.mock.calls[0][0];
    expect(usersArg).toHaveLength(5);

    // Roles seeded (11)
    expect(rolesRepo.save).toHaveBeenCalledTimes(1);
    const rolesArg = rolesRepo.save.mock.calls[0][0];
    expect(rolesArg).toHaveLength(11);
  });

  it('does not reseed tables when already populated', async () => {
    // Pre-populate all repos to simulate existing data
    state.offices.push({ id: 1, name: 'Organization Office' });
    state.categories.push({ id: 1, name: 'Other', officeId: 1 });
    state.users.push({ id: 1, username: 'admin', email: 'a@b.c', name: 'A', surname: 'B', password: 'x', salt: 'y', userType: 'admin', emailNotifications: false });
    state.roles.push({ id: 1, name: 'Municipal Administrator', officeId: 1 });

    await seedDatabase();

    expect(officeRepo.save).not.toHaveBeenCalled();
    expect(categoryRepo.save).not.toHaveBeenCalled();
    expect(userRepo.save).not.toHaveBeenCalled();
    expect(rolesRepo.save).not.toHaveBeenCalled();
  });
});

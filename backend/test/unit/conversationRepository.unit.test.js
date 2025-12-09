// backend/test/unit/conversationRepository.unit.test.js
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const fakeConversation = Symbol('FakeConversation');

await jest.unstable_mockModule('../../entities/Conversation.js', () => ({
  Conversation: fakeConversation
}));

const mockCreateQueryBuilder = jest.fn();
const mockCreate = jest.fn();
const mockSave = jest.fn();
const mockFindOne = jest.fn();
const mockFindOneBy = jest.fn();

await jest.unstable_mockModule('../../config/data-source.js', () => ({
  AppDataSourcePostgres: {
    getRepository: jest.fn((entity) => {
      if (entity === fakeConversation) {
        return {
          createQueryBuilder: mockCreateQueryBuilder,
          create: mockCreate,
          save: mockSave,
          findOne: mockFindOne,
        };
      }
      // For 'Users' string
      if (entity === 'Users') {
        return {
          findOneBy: mockFindOneBy
        };
      }
      return {};
    })
  }
}));

const {
  getConversationsForUser,
  createConversation,
  addParticipantToConversation
} = await import('../../repositories/conversationRepository.js');
const { AppDataSourcePostgres } = await import('../../config/data-source.js');
const { Conversation } = await import('../../entities/Conversation.js');

describe('conversationRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getConversationsForUser chiama query builder', async () => {
    const getMany = jest.fn().mockResolvedValue([{ id: 1 }]);
    mockCreateQueryBuilder.mockReturnValue({
      leftJoinAndSelect: () => ({
        leftJoinAndSelect: () => ({
          where: () => ({
            getMany
          })
        })
      })
    });
    const result = await getConversationsForUser(42);
    expect(AppDataSourcePostgres.getRepository).toHaveBeenCalledWith(Conversation);
    expect(getMany).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1 }]);
  });

  it('createConversation crea e salva', async () => {
    mockCreate.mockReturnValue({ report: 1, participants: [2], isInternal: false });
    mockSave.mockResolvedValue({ id: 99 });
    const result = await createConversation({ report: 1, participants: [2] });
    expect(mockCreate).toHaveBeenCalledWith({ report: 1, participants: [2], isInternal: false });
    expect(mockSave).toHaveBeenCalledWith({ report: 1, participants: [2], isInternal: false });
    expect(result).toEqual({ id: 99 });
  });

  it('addParticipantToConversation aggiunge utente se non presente', async () => {
    mockFindOne.mockResolvedValue({
      id: 1,
      participants: [{ id: 2 }]
    });
    mockFindOneBy.mockResolvedValue({ id: 3 });
    mockSave.mockResolvedValue({ id: 1, participants: [{ id: 2 }, { id: 3 }] });
    const result = await addParticipantToConversation(1, 3);
    expect(mockFindOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['participants'] });
    expect(mockFindOneBy).toHaveBeenCalledWith({ id: 3 });
    expect(mockSave).toHaveBeenCalled();
    expect(result).toEqual({ id: 1, participants: [{ id: 2 }, { id: 3 }] });
  });

  it('addParticipantToConversation non aggiunge se già presente', async () => {
    mockFindOne.mockResolvedValue({
      id: 1,
      participants: [{ id: 2 }, { id: 3 }]
    });
    const result = await addParticipantToConversation(1, 3);
    expect(mockFindOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['participants'] });
    expect(result).toEqual({ id: 1, participants: [{ id: 2 }, { id: 3 }] });
  });

  it('addParticipantToConversation lancia errore se conversazione non trovata', async () => {
    mockFindOne.mockResolvedValue(null);
    await expect(addParticipantToConversation(1, 3)).rejects.toThrow('Conversation not found');
  });

  it('addParticipantToConversation lancia errore se user non trovato', async () => {
    mockFindOne.mockResolvedValue({ id: 1, participants: [] });
    mockFindOneBy.mockResolvedValue(null);
    await expect(addParticipantToConversation(1, 3)).rejects.toThrow('User not found');
  });
});

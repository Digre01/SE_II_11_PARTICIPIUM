import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { conversationRepoStub, userRepoStub } from "../mocks/shared.mocks.js";

const {
  getConversationsForUser,
  createConversation,
  addParticipantToConversation
} = await import('../../../repositories/conversationRepository.js');

describe('conversationRepository', () => {
  // ---- Variabili di mock comuni ----
  const mockConversations = [{ id: 1 }];
  let mockConversation = { id: 1, participants: [{ id: 2 }] };
  let mockUser = { id: 3 };
  let mockUpdatedConversation = { id: 1, participants: [{ id: 2 }, { id: 3 }] };
  let getMany = jest.fn().mockResolvedValue(mockConversations);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getConversationsForUser chiama query builder', async () => {
    conversationRepoStub.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: () => ({
        leftJoinAndSelect: () => ({
          where: () => ({
            getMany
          })
        })
      })
    });

    const result = await getConversationsForUser(42);

    expect(getMany).toHaveBeenCalled();
    expect(result).toEqual(mockConversations);
  });

  it('createConversation crea e salva', async () => {
    const mockConversationData = { report: 1, participants: [2], isInternal: false };
    const mockSavedConversation = { id: 99 };

    conversationRepoStub.create.mockReturnValue(mockConversationData);
    conversationRepoStub.save.mockResolvedValue(mockSavedConversation);

    const result = await createConversation({ report: 1, participants: [2] });

    expect(conversationRepoStub.create).toHaveBeenCalledWith(mockConversationData);
    expect(conversationRepoStub.save).toHaveBeenCalledWith(mockConversationData);
    expect(result).toEqual(mockSavedConversation);
  });

  it('addParticipantToConversation aggiunge utente se non presente', async () => {
    conversationRepoStub.findOne.mockResolvedValue(mockConversation);
    userRepoStub.findOneBy.mockResolvedValue(mockUser);
    conversationRepoStub.save.mockResolvedValue(mockUpdatedConversation);

    const result = await addParticipantToConversation(1, 3);

    expect(conversationRepoStub.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['participants']
    });
    expect(userRepoStub.findOneBy).toHaveBeenCalledWith({ id: 3 });
    expect(conversationRepoStub.save).toHaveBeenCalled();
    expect(result).toEqual(mockUpdatedConversation);
  });

  it('addParticipantToConversation non aggiunge se già presente', async () => {
    const convWithUser = { id: 1, participants: [{ id: 2 }, { id: 3 }] };
    conversationRepoStub.findOne.mockResolvedValue(convWithUser);

    const result = await addParticipantToConversation(1, 3);

    expect(conversationRepoStub.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['participants']
    });
    expect(result).toEqual(convWithUser);
  });

  it('addParticipantToConversation lancia errore se conversazione non trovata', async () => {
    conversationRepoStub.findOne.mockResolvedValue(null);

    await expect(addParticipantToConversation(1, 3)).rejects.toThrow('Conversation not found');
  });

  it('addParticipantToConversation lancia errore se user non trovato', async () => {
    const mockConversationWithoutUser = { id: 1, participants: [{ id: 2 }] };

    conversationRepoStub.findOne.mockResolvedValue(mockConversationWithoutUser);
    userRepoStub.findOneBy.mockResolvedValue(null);

    await expect(addParticipantToConversation(1, 3))
        .rejects.toThrow('User not found');
  });


  it('createConversation crea conversazione interna quando isInternal è true', async () => {
    const mockInternalConversationData = {
      report: 1,
      participants: [2, 3],
      isInternal: true
    };
    const mockSavedInternalConversation = {
      id: 100,
      report: 1,
      participants: [2, 3],
      isInternal: true
    };

    conversationRepoStub.create.mockReturnValue(mockInternalConversationData);
    conversationRepoStub.save.mockResolvedValue(mockSavedInternalConversation);

    const result = await createConversation({
      report: 1,
      participants: [2, 3],
      isInternal: true
    });

    expect(conversationRepoStub.create).toHaveBeenCalledWith(mockInternalConversationData);
    expect(result.isInternal).toBe(true);
    expect(result.id).toBe(100);
  });

  it('createConversation crea conversazione pubblica di default (isInternal false)', async () => {
    const mockPublicConversationData = {
      report: 1,
      participants: [2],
      isInternal: false
    };
    const mockSavedPublicConversation = {
      id: 101,
      isInternal: false
    };

    conversationRepoStub.create.mockReturnValue(mockPublicConversationData);
    conversationRepoStub.save.mockResolvedValue(mockSavedPublicConversation);

    const result = await createConversation({
      report: 1,
      participants: [2]
    });

    expect(conversationRepoStub.create).toHaveBeenCalledWith(mockPublicConversationData);
    expect(result.isInternal).toBe(false);
  });

  it('getConversationsForUser può recuperare sia conversazioni interne che pubbliche', async () => {
    const mockMixedConversations = [
      { id: 1, isInternal: true, report: { id: 10 } },
      { id: 2, isInternal: false, report: { id: 10 } }
    ];

    getMany.mockResolvedValue(mockMixedConversations);

    conversationRepoStub.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: () => ({
        leftJoinAndSelect: () => ({
          where: () => ({
            getMany
          })
        })
      })
    });

    const result = await getConversationsForUser(42);

    expect(result).toHaveLength(2);
    expect(result[0].isInternal).toBe(true);
    expect(result[1].isInternal).toBe(false);
  });

  it('addParticipantToConversation può aggiungere partecipante a conversazione interna', async () => {
    const mockInternalConversation = {
      id: 1,
      isInternal: true,
      participants: [{ id: 2 }]
    };
    const mockUpdatedInternalConversation = {
      id: 1,
      isInternal: true,
      participants: [{ id: 2 }, { id: 3 }]
    };

    conversationRepoStub.findOne.mockResolvedValue(mockInternalConversation);
    userRepoStub.findOneBy.mockResolvedValue(mockUser);
    conversationRepoStub.save.mockResolvedValue(mockUpdatedInternalConversation);

    const result = await addParticipantToConversation(1, 3);

    expect(result.isInternal).toBe(true);
    expect(result.participants).toHaveLength(2);
    expect(result.participants.some(p => p.id === 3)).toBe(true);
  });

  it('getConversationsForUser restituisce solo conversazioni dove utente è partecipante', async () => {
    const mockUserConversations = [
      { id: 1, isInternal: false, participants: [{ id: 5 }] },
    ];

    getMany.mockResolvedValue(mockUserConversations);

    conversationRepoStub.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: () => ({
        leftJoinAndSelect: () => ({
          where: () => ({
            getMany
          })
        })
      })
    });

    const result = await getConversationsForUser(5);

    expect(result).toHaveLength(1);
    expect(result[0].isInternal).toBe(false);
  });
});

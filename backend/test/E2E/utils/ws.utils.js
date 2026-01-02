import {jest} from "@jest/globals";

const wsHandlerMock = {
    setupWebSocket: jest.fn(),
    broadcastToConversation: jest.fn(),
}

export async function setupWsMock() {
    await jest.unstable_mockModule("../../../wsHandler.js", () => ({
        setupWebSocket: wsHandlerMock.setupWebSocket,
        broadcastToConversation: wsHandlerMock.broadcastToConversation,
    }))
}
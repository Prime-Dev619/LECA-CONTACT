import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchConversations = createAsyncThunk('chat/fetchConversations', async () => {
  const res = await api.get('/messages');
  return res.items;
});

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (conversationId) => {
  const res = await api.get(`/messages/${conversationId}/messages`);
  return { conversationId, messages: res.items };
});

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({ conversationId, body }) => {
  const res = await api.post(`/messages/${conversationId}/messages`, { body });
  return { conversationId, message: { id: res.id, body } };
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: { conversations: [], messages: {}, status: 'idle' },
  reducers: {
    receivedSocketMessage(state, action) {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) state.messages[conversationId] = [];
      state.messages[conversationId].push(message);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.fulfilled, (state, action) => { state.conversations = action.payload; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, messages } = action.payload;
        state.messages[conversationId] = messages;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { conversationId, message } = action.payload;
        if (!state.messages[conversationId]) state.messages[conversationId] = [];
        state.messages[conversationId].push(message);
      });
  }
});

export const { receivedSocketMessage } = chatSlice.actions;
export default chatSlice.reducer;

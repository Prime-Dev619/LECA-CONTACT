import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../utils/api';

const TOKEN_KEY = 'leca_token';

export const loadToken = createAsyncThunk('auth/loadToken', async () => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token || null;
});

export const login = createAsyncThunk('auth/login', async ({ email, password }) => {
  const res = await api.post('/auth/login', { email, password });
  await SecureStore.setItemAsync(TOKEN_KEY, res.token);
  return res;
});

export const signup = createAsyncThunk('auth/signup', async (payload) => {
  const res = await api.post('/auth/signup', payload);
  await SecureStore.setItemAsync(TOKEN_KEY, res.token);
  return res;
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  return true;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: null, user: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadToken.fulfilled, (state, action) => {
        state.token = action.payload;
      })
      .addCase(login.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message; })
      .addCase(signup.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(signup.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message; })
      .addCase(logout.fulfilled, (state) => { state.token = null; state.user = null; });
  }
});

export default authSlice.reducer;

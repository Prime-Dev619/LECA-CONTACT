import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchListings = createAsyncThunk('marketplace/fetchListings', async (params) => {
  const res = await api.get('/listings', params);
  return res.items;
});

export const createListing = createAsyncThunk('marketplace/createListing', async (payload) => {
  const res = await api.post('/listings', payload);
  return res;
});

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchListings.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchListings.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchListings.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message; })
      .addCase(createListing.fulfilled, (state, action) => { state.items.unshift(action.payload); });
  }
});

export default marketplaceSlice.reducer;

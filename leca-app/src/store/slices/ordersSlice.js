import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const checkout = createAsyncThunk('orders/checkout', async ({ listingId, quantity }) => {
  const res = await api.post('/transactions/checkout', { listingId, quantity });
  return res;
});

export const fetchOrders = createAsyncThunk('orders/fetchOrders', async () => {
  const res = await api.get('/transactions/orders');
  return res.items;
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.fulfilled, (state, action) => { state.items = action.payload; })
      .addCase(checkout.fulfilled, (state, action) => { state.lastOrder = action.payload; });
  }
});

export default ordersSlice.reducer;

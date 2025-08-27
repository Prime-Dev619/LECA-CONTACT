import React, { useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../../store/slices/ordersSlice';

export default function OrdersScreen() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.orders.items);
  useEffect(() => { dispatch(fetchOrders()); }, [dispatch]);
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text>Order: {item.id.slice(0, 8)} - {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}


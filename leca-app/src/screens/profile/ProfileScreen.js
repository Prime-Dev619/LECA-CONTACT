import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import { api } from '../../utils/api';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/profiles/me').then(setData); }, []);
  if (!data) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></View>;
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>{data.user.name}</Text>
      <Text>{data.user.email} · Rating {data.user.rating_avg} ({data.user.rating_count})</Text>
      <Button title="Log out" onPress={() => dispatch(logout())} />
      <Text style={{ marginTop: 16, fontWeight: '700' }}>My Listings</Text>
      <FlatList data={data.listings} keyExtractor={(i) => i.id} renderItem={({ item }) => (
        <View style={{ paddingVertical: 8 }}><Text>{item.title}</Text></View>
      )} />
    </View>
  );
}


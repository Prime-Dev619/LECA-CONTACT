import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchListings } from '../../store/slices/marketplaceSlice';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.marketplace.items);
  const [q, setQ] = useState('');
  useEffect(() => { dispatch(fetchListings({})); }, [dispatch]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ListingDetail', { id: item.id })}>
      <Text style={styles.title}>{item.title}</Text>
      <Text numberOfLines={2} style={styles.desc}>{item.description}</Text>
      <Text style={styles.price}>${(item.price_cents / 100).toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchRow}>
        <TextInput placeholder="Search" value={q} onChangeText={setQ} style={styles.search} />
        <TouchableOpacity onPress={() => dispatch(fetchListings({ q }))} style={styles.searchBtn}><Text>Go</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('NewListing')} style={styles.newBtn}><Text>+ New</Text></TouchableOpacity>
      </View>
      <FlatList data={items} keyExtractor={(i) => i.id} renderItem={renderItem} contentContainerStyle={{ padding: 12 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', padding: 12, gap: 8, alignItems: 'center' },
  search: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 },
  searchBtn: { padding: 10, backgroundColor: '#eee', borderRadius: 8 },
  newBtn: { padding: 10, backgroundColor: '#cdeffd', borderRadius: 8 },
  card: { backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  title: { fontSize: 16, fontWeight: '600' },
  desc: { color: '#444', marginTop: 4 },
  price: { marginTop: 8, fontWeight: '700' },
});


import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { api } from '../../utils/api';
import { useDispatch } from 'react-redux';
import { checkout } from '../../store/slices/ordersSlice';

export default function ListingDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [item, setItem] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    api.get(`/listings/${id}`).then(setItem);
  }, [id]);

  if (!item) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.description}</Text>
      <Text style={styles.price}>${(item.price_cents / 100).toFixed(2)}</Text>
      <Button title="Buy Now" onPress={async () => {
        const res = await dispatch(checkout({ listingId: id, quantity: 1 })).unwrap();
        navigation.navigate('Checkout', { order: res });
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  desc: { marginTop: 8, color: '#333' },
  price: { marginVertical: 12, fontWeight: '700' }
});


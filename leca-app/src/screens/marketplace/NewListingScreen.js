import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { createListing } from '../../store/slices/marketplaceSlice';

export default function NewListingScreen({ navigation }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ title: '', description: '', priceCents: 0 });
  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Listing</Text>
      <TextInput style={styles.input} placeholder="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
      <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} />
      <TextInput style={styles.input} placeholder="Price (cents)" keyboardType="numeric" value={String(form.priceCents)} onChangeText={(v) => setForm({ ...form, priceCents: Number(v || 0) })} />
      <Button title="Create" onPress={async () => {
        await dispatch(createListing({ ...form, images: [] })).unwrap();
        navigation.goBack();
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 }
});


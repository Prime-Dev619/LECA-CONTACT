import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function CheckoutScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { order } = route.params || {};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Confirmed</Text>
      <Text>Status: {order?.status || 'paid'}</Text>
      <Button title="Back to Home" onPress={() => navigation.navigate('Tabs')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
});


import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { signup } from '../../store/slices/authSlice';

export default function SignupScreen() {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.auth.status);
  const error = useSelector((s) => s.auth.error);
  const [form, setForm] = useState({ name: '', email: '', password: '', universityId: '', universityEmail: '' });

  const onSubmit = () => {
    dispatch(signup(form));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your LECA account</Text>
      <TextInput style={styles.input} placeholder="Full name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} />
      <TextInput style={styles.input} placeholder="University ID" value={form.universityId} onChangeText={(v) => setForm({ ...form, universityId: v })} />
      <TextInput style={styles.input} placeholder="University Email (.edu)" autoCapitalize="none" value={form.universityEmail} onChangeText={(v) => setForm({ ...form, universityEmail: v })} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={status === 'loading' ? 'Creating...' : 'Sign Up'} onPress={onSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  error: { color: 'red', marginBottom: 12, textAlign: 'center' }
});


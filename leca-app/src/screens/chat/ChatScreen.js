import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { fetchMessages, sendMessage, receivedSocketMessage } from '../../store/slices/chatSlice';

export default function ChatScreen({ route }) {
  const { conversationId } = route.params;
  const dispatch = useDispatch();
  const msgs = useSelector((s) => s.chat.messages[conversationId] || []);
  const [body, setBody] = useState('');

  useEffect(() => {
    dispatch(fetchMessages(conversationId));
  }, [conversationId, dispatch]);

  useEffect(() => {
    let socket;
    (async () => {
      const token = await SecureStore.getItemAsync('leca_token');
      socket = io(process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:4000', { auth: { token } });
      socket.on('message:new', (payload) => {
        dispatch(receivedSocketMessage({ conversationId: payload.conversationId, message: payload }));
      });
    })();
    return () => { if (socket) socket.disconnect(); };
  }, [dispatch]);

  return (
    <View style={{ flex: 1 }}>
      <FlatList data={msgs} keyExtractor={(i) => i.id} renderItem={({ item }) => (
        <View style={{ padding: 8 }}><Text>{item.body}</Text></View>
      )} />
      <View style={{ flexDirection: 'row', padding: 8, gap: 8 }}>
        <TextInput style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8 }} value={body} onChangeText={setBody} />
        <Button title="Send" onPress={() => { if (body.trim()) { dispatch(sendMessage({ conversationId, body })); setBody(''); } }} />
      </View>
    </View>
  );
}


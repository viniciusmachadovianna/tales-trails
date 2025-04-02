import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import { Camera, CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { format } from 'date-fns';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [cards, setCards] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [newCard, setNewCard] = useState({
    local: '',
    date: format(new Date(), 'dd/MM/yyyy'),
    photo: null
  });
  
  const cameraRef = useRef(null);

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }
  useEffect(() => {
    loadCards();
    requestCameraPermission();
  }, []);

  const loadCards = async () => {
    try {
      const savedCards = await AsyncStorage.getItem('cards');
      if (savedCards) {
        setCards(JSON.parse(savedCards));
      }
    } catch (error) {
      console.error('Erro ao carregar cards:', error);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(status === 'granted');
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setNewCard({...newCard, photo: photo.uri});
      setCameraVisible(false);
    }
  };

  const saveCard = async () => {
    if (!newCard.local || !newCard.photo) {
      alert('Preencha todos os campos e tire uma foto!');
      return;
    }

    const cardToSave = {
      ...newCard,
      id: Date.now().toString()
    };

    try {
      const updatedCards = [...cards, cardToSave];
      await AsyncStorage.setItem('cards', JSON.stringify(updatedCards));
      setCards(updatedCards);
      setModalVisible(false);
      setNewCard({
        local: '',
        date: format(new Date(), 'dd/MM/yyyy'),
        photo: null
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.local}</Text>
      <Text style={styles.cardDate}>{item.date}</Text>
      {item.photo && (
        <Image source={{ uri: item.photo }} style={styles.cardImage} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Locais</Text>
      </View>

      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum local cadastrado ainda</Text>
        }
      />

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Adicionar um Local</Text>

          <TextInput
            placeholder="Nome do local"
            value={newCard.local}
            onChangeText={(text) => setNewCard({...newCard, local: text})}
            style={styles.input}
          />

          <TextInput
            placeholder="Data"
            value={newCard.date}
            onChangeText={(text) => setNewCard({...newCard, date: text})}
            style={styles.input}
          />

          {newCard.photo ? (
            <Image source={{ uri: newCard.photo }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text>Nenhuma foto tirada</Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <Button
              title={newCard.photo ? "Tirar outra foto" : "Tirar foto"}
              onPress={() => setCameraVisible(true)}
            />
            <Button
              title="Cancelar"
              onPress={() => {
                setModalVisible(false);
                setNewCard({
                  local: '',
                  date: format(new Date(), 'dd/MM/yyyy'),
                  photo: null
                });
              }}
              color="red"
            />
            <Button
              title="Salvar"
              onPress={saveCard}
              disabled={!newCard.local || !newCard.photo}
            />
          </View>
        </View>
      </Modal>

      {cameraVisible && (
        <View style={styles.cameracontainer}>
        <CameraView style={styles.camera} facing={facing}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDate: {
    color: '#666',
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#6200ee',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 4,
    marginBottom: 16,
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraButtons: {
    position: 'absolute',
    bottom: 32,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
});
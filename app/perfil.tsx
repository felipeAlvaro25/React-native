import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';

// La URL de tu API. Asegúrate de que esta URL base apunte directamente
// al script PHP de perfil (perfil.php).
const API_URL = 'https://felipe25.alwaysdata.net/api/erfil.php';

export default function BuyerProfile() {
  const [image, setImage] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [edad, setEdad] = useState('');
  const [usuario, setUsuario] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const init = async () => {
      try {
        const uid = await AsyncStorage.getItem('firebase_uid');
        if (uid) {
          fetchUserProfile(uid);
        } else {
          Alert.alert('Error', 'No se encontró el usuario. Por favor, inicie sesión de nuevo.');
        }
      } catch (error) {
        console.error('Error al iniciar perfil:', error);
        Alert.alert('Error', 'Ocurrió un problema al cargar tus datos iniciales.');
      }
    };

    init();

    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar una imagen de perfil.');
      }
    })();
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      // Para la solicitud GET, añadimos el UID como parámetro de consulta a la API_URL
      const response = await fetch(`${API_URL}?uid=${uid}`);
      const data = await response.json();

      if (data.success && data.user) {
        const user = data.user;
        setNombre(user.nombre);
        setApellido(user.apellido);
        setCorreo(user.email); // Asegúrate de que tu backend PHP devuelve 'email'
        setDireccion(user.direccion || '');
        setEdad(user.edad?.toString() || '');
        setUsuario(user.usuario || '');
      } else {
        // Muestra el mensaje de error del backend si success es false
        Alert.alert('Error', data.message || 'Perfil no encontrado o datos incompletos.');
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor para cargar el perfil.');
    }
  };

  const saveProfileChanges = async () => {
    try {
      const uid = await AsyncStorage.getItem('firebase_uid');
      if (!uid) {
        Alert.alert('Error', 'No se encontró el UID del usuario. No se pueden guardar los cambios.');
        return;
      }

      const userData = {
        firebase_uid: uid,
        nombre,
        apellido,
        direccion,
        edad: parseInt(edad) || 0, // Asegura que la edad sea un número
        usuario,
      };

      // Para la solicitud PUT, usamos la API_URL directamente como endpoint
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente.');
        setIsEditing(false); // Sale del modo de edición
      } else {
        Alert.alert('Error', result.message || 'No se pudo actualizar el perfil.');
      }

    } catch (error) {
      console.error('Error al guardar perfil:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar los cambios en el perfil.');
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      // Aquí deberías añadir la lógica para subir la imagen al servidor si quieres guardarla.
    }
  };

  return (
    <AnimatedContainer style={{ opacity: fadeAnim }}>
      <TouchableOpacity onPress={pickImage} disabled={!isEditing}> {/* Solo editable si está en modo edición */}
        {image ? (
          <ProfileImage source={{ uri: image }} />
        ) : (
          <ImagePlaceholder>
            <PlaceholderText>Subir Imagen</PlaceholderText>
          </ImagePlaceholder>
        )}
      </TouchableOpacity>

      {isEditing ? (
        <>
          <Input value={nombre} onChangeText={setNombre} placeholder="Nombre" placeholderTextColor="#999" />
          <Input value={apellido} onChangeText={setApellido} placeholder="Apellido" placeholderTextColor="#999" />
          <DisabledField>Correo: {correo}</DisabledField> {/* El correo no se edita aquí */}
          <Input value={direccion} onChangeText={setDireccion} placeholder="Dirección" placeholderTextColor="#999" />
          <Input
            value={edad}
            onChangeText={(text) => setEdad(text.replace(/[^0-9]/g, ''))} // Solo números para la edad
            placeholder="Edad"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Input value={usuario} onChangeText={setUsuario} placeholder="Usuario" placeholderTextColor="#999" />

          <SaveButton onPress={saveProfileChanges}>
            <ButtonText>Guardar Cambios</ButtonText>
          </SaveButton>
          <CancelButton onPress={() => setIsEditing(false)}> {/* Botón para cancelar edición */}
            <ButtonText>Cancelar</ButtonText>
          </CancelButton>
        </>
      ) : (
        <>
          <InfoText>👤 {nombre} {apellido}</InfoText>
          <InfoText>📧 {correo}</InfoText>
          <InfoText>🏠 {direccion || 'No especificado'}</InfoText>
          <InfoText>🎂 {edad ? `${edad} años` : 'No especificado'}</InfoText>
          <InfoText>🔑 Usuario: {usuario || 'No especificado'}</InfoText>

          <EditButton onPress={() => setIsEditing(true)}>
            <ButtonText>Editar Perfil</ButtonText>
          </EditButton>
        </>
      )}
    </AnimatedContainer>
  );
}

// Styled Components con colores fijos
const AnimatedContainer = Animated.createAnimatedComponent(styled.View`
  flex: 1;
  padding: 30px 20px;
  align-items: center;
  background-color: #f0f0f0; /* Fondo claro */
`);

const ProfileImage = styled.Image`
  width: 130px;
  height: 130px;
  border-radius: 65px;
  margin-bottom: 25px;
  border: 3px solid #6200ee; /* Borde morado */
`;

const ImagePlaceholder = styled.View`
  width: 130px;
  height: 130px;
  border-radius: 65px;
  background-color: #ddd; /* Gris claro */
  justify-content: center;
  align-items: center;
  margin-bottom: 25px;
  border: 2px dashed #6200ee; /* Borde punteado morado */
`;

const PlaceholderText = styled.Text`
  color: #666; /* Gris oscuro */
  font-size: 14px;
`;

const Input = styled.TextInput`
  width: 90%;
  padding: 12px 15px;
  margin-bottom: 12px;
  border-radius: 12px;
  background-color: #fff; /* Blanco */
  color: #000; /* Negro */
  border: 1px solid #6200ee; /* Borde morado */
`;

const DisabledField = styled.Text`
  width: 90%;
  padding: 12px 15px;
  margin-bottom: 12px;
  border-radius: 12px;
  background-color: #eee; /* Gris muy claro */
  color: #666; /* Gris oscuro */
  border: 1px dashed #aaa; /* Borde punteado gris */
`;

const InfoText = styled.Text`
  font-size: 16px;
  color: #333; /* Gris oscuro */
  margin-bottom: 8px;
`;

const EditButton = styled.TouchableOpacity`
  background-color: #6200ee; /* Morado */
  padding: 12px 25px;
  border-radius: 10px;
  margin-top: 20px;
`;

const SaveButton = styled(EditButton)`
  background-color: #4caf50; /* Verde */
  margin-bottom: 10px; /* Espacio entre guardar y cancelar */
`;

const CancelButton = styled(EditButton)`
  background-color: #f44336; /* Rojo */
`;

const ButtonText = styled.Text`
  color: white;
  font-weight: bold;
  font-size: 16px;
`;
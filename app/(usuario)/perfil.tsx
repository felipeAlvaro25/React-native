import { router } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { styled } from "styled-components/native";
import { Alert, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { auth } from '../../Firebase/firebaseconfig';
import { signOut } from 'firebase/auth';
import { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'https://felipe25.alwaysdata.net/api/perfil.php';

export default function BuyerProfile() {
  const [userData, setUserData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    direccion: '',
    edad: '',
    usuario: '',
    photoURL: null as string | null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Obtener datos del usuario al cargar el componente
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          Alert.alert('Error', 'No hay sesión activa');
          router.replace('/login');
          return;
        }

        // Obtener datos del perfil desde tu API
        const response = await fetch(`${API_URL}?uid=${currentUser.uid}`);
        
        if (!response.ok) {
          throw new Error('Error al obtener datos del perfil');
        }

        const data = await response.json();

        if (data.success && data.user) {
          setUserData({
            nombre: data.user.nombre || '',
            apellido: data.user.apellido || '',
            email: currentUser.email || '',
            direccion: data.user.direccion || '',
            edad: data.user.edad?.toString() || '',
            usuario: data.user.usuario || '',
            photoURL: currentUser.photoURL || null
          });
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar el perfil');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    // Solicitar permisos para la galería
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galería');
      }
    })();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'No hay sesión activa');
        return;
      }

      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: currentUser.uid,
          nombre: userData.nombre,
          apellido: userData.apellido,
          direccion: userData.direccion,
          edad: userData.edad,
          usuario: userData.usuario
        })
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Éxito', 'Perfil actualizado');
        setIsEditing(false);
      } else {
        Alert.alert('Error', result.message || 'Error al actualizar');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.clear();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
      console.error(error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setUserData(prev => ({ ...prev, photoURL: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#6200ee" />
      </Container>
    );
  }

  return (
    <AnimatedContainer style={{ opacity: fadeAnim }}>
      <ProfileHeader>
        <TouchableOpacity onPress={() => router.back()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <HeaderTitle>Mi Perfil</HeaderTitle>
        <TouchableOpacity onPress={handleSignOut}>
          <AntDesign name="logout" size={24} color="white" />
        </TouchableOpacity>
      </ProfileHeader>

      <ProfileContent>
        <TouchableOpacity onPress={pickImage} disabled={!isEditing}>
          {userData.photoURL ? (
            <ProfileImage source={{ uri: userData.photoURL }} />
          ) : (
            <ImagePlaceholder>
              <AntDesign name="user" size={40} color="#6200ee" />
            </ImagePlaceholder>
          )}
        </TouchableOpacity>

        {isEditing ? (
          <>
            <Input 
              value={userData.nombre} 
              onChangeText={(text) => setUserData(prev => ({ ...prev, nombre: text }))} 
              placeholder="Nombre"
              placeholderTextColor="#999"
            />
            <Input 
              value={userData.apellido} 
              onChangeText={(text) => setUserData(prev => ({ ...prev, apellido: text }))} 
              placeholder="Apellido"
              placeholderTextColor="#999"
            />
            <DisabledField>Correo: {userData.email}</DisabledField>
            <Input 
              value={userData.direccion} 
              onChangeText={(text) => setUserData(prev => ({ ...prev, direccion: text }))} 
              placeholder="Dirección"
              placeholderTextColor="#999"
            />
            <Input
              value={userData.edad}
              onChangeText={(text) => setUserData(prev => ({ 
                ...prev, 
                edad: text.replace(/[^0-9]/g, '') 
              }))}
              placeholder="Edad"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <Input 
              value={userData.usuario} 
              onChangeText={(text) => setUserData(prev => ({ ...prev, usuario: text }))} 
              placeholder="Usuario"
              placeholderTextColor="#999"
            />
            
            <SaveButton onPress={handleUpdateProfile}>
              <ButtonText>Guardar Cambios</ButtonText>
            </SaveButton>
            <CancelButton onPress={() => setIsEditing(false)}>
              <ButtonText>Cancelar</ButtonText>
            </CancelButton>
          </>
        ) : (
          <>
            <InfoText>👤 {userData.nombre} {userData.apellido}</InfoText>
            <InfoText>📧 {userData.email}</InfoText>
            <InfoText>🏠 {userData.direccion || 'No especificado'}</InfoText>
            <InfoText>🎂 {userData.edad ? `${userData.edad} años` : 'No especificado'}</InfoText>
            <InfoText>🔑 Usuario: {userData.usuario || 'No especificado'}</InfoText>
            
            <EditButton onPress={() => setIsEditing(true)}>
              <ButtonText>Editar Perfil</ButtonText>
            </EditButton>
          </>
        )}
      </ProfileContent>
    </AnimatedContainer>
  );
}

// Estilos
const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const AnimatedContainer = Animated.createAnimatedComponent(styled.View`
  flex: 1;
  background-color: #f0f0f0;
`);

const ProfileHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #6200ee;
`;

const HeaderTitle = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: bold;
`;

const ProfileContent = styled.View`
  flex: 1;
  padding: 20px;
  align-items: center;
`;

const ProfileImage = styled.Image`
  width: 130px;
  height: 130px;
  border-radius: 65px;
  margin-bottom: 25px;
  border: 3px solid #6200ee;
`;

const ImagePlaceholder = styled.View`
  width: 130px;
  height: 130px;
  border-radius: 65px;
  background-color: #ddd;
  justify-content: center;
  align-items: center;
  margin-bottom: 25px;
  border: 2px dashed #6200ee;
`;

const Input = styled.TextInput`
  width: 90%;
  padding: 12px 15px;
  margin-bottom: 12px;
  border-radius: 12px;
  background-color: #fff;
  color: #000;
  border: 1px solid #6200ee;
`;

const DisabledField = styled.Text`
  width: 90%;
  padding: 12px 15px;
  margin-bottom: 12px;
  border-radius: 12px;
  background-color: #eee;
  color: #666;
  border: 1px dashed #aaa;
`;

const InfoText = styled.Text`
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
`;

const EditButton = styled.TouchableOpacity`
  background-color: #6200ee;
  padding: 12px 25px;
  border-radius: 10px;
  margin-top: 20px;
`;

const SaveButton = styled(EditButton)`
  background-color: #4caf50;
  margin-bottom: 10px;
`;

const CancelButton = styled(EditButton)`
  background-color: #f44336;
`;

const ButtonText = styled.Text`
  color: white;
  font-weight: bold;
  font-size: 16px;
`;
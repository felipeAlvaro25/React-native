import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styled } from 'styled-components/native';

// Firebase (solo para autenticación)
import { auth } from '../../../Firebase/firebaseconfig';

// Configuración
const ADMIN_EMAILS = [
  'felipealvaro48@gmail.com',
  'cesarapsricio@gmail.com',
  'christoferj2002@gmail.com'
];
const API_URL = 'https://felipe25.alwaysdata.net/api/proveedores.php';

export default function EditarProveedor() {
  const { id } = useLocalSearchParams();
  const [proveedor, setProveedor] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    categoria: ''
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState([]);

  // Verificar permisos de administrador
  const isAdmin = ADMIN_EMAILS.includes(auth.currentUser?.email || '');

  // Cargar datos del proveedor y categorías
  useEffect(() => {
    if (!isAdmin) return;

    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar categorías
        const categoriasResponse = await fetch(`${API_URL}?accion=obtener_categorias`);
        const categoriasData = await categoriasResponse.json();
        
        if (categoriasData.success) {
          setCategorias(categoriasData.categorias);
        } else {
          setError('Error al cargar categorías');
        }

        // Cargar datos del proveedor
        const proveedorResponse = await fetch(`${API_URL}?accion=obtener_proveedor&id=${id}`);
        const proveedorData = await proveedorResponse.json();
        
        if (proveedorData.success && proveedorData.proveedor) {
          const prov = proveedorData.proveedor;
          setProveedor(prov);
          setCurrentImage(prov.logo);
          setFormData({
            nombre: prov.nombre,
            ruc: prov.ruc,
            categoria: prov.categoria.toString()
          });
        } else {
          setError('Proveedor no encontrado');
          router.back();
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar datos del proveedor');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id, isAdmin]);

  // Verificar permisos de administrador al renderizar
  if (!isAdmin) {
    return (
      <Container>
        <ErrorText>Acceso restringido</ErrorText>
        <AuthButton onPress={() => router.back()}>
          <ButtonText>Volver</ButtonText>
        </AuthButton>
      </Container>
    );
  }

  const handleChange = (field, value) => {
    // Validar RUC si es el campo que está cambiando
    if (field === 'ruc') {
      // Solo permitir números y máximo 13 caracteres (típico para RUC)
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue.length > 13) return; // No permitir más de 13 dígitos
      value = numericValue;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  // Función para seleccionar imagen
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Error', 'Se necesitan permisos para acceder a las imágenes');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
        setCurrentImage(null); // Limpiar la imagen actual si se selecciona una nueva
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Error al seleccionar imagen');
    }
  };

  // Función para validar el formulario
  const validarFormulario = () => {
    const { nombre, ruc, categoria } = formData;

    if (!nombre.trim()) {
      setError('El nombre del proveedor es obligatorio');
      return false;
    }

    if (!ruc.trim()) {
      setError('El RUC es obligatorio');
      return false;
    }

    if (ruc.length < 4) {
      setError('El RUC debe tener al menos 4 dígitos');
      return false;
    }

    if (!categoria) {
      setError('Debe seleccionar una categoría');
      return false;
    }

    // No requerir imagen si ya hay una actual
    if (!selectedImage && !currentImage) {
      setError('Debe seleccionar una imagen para el proveedor');
      return false;
    }

    return true;
  };

  // Función para actualizar proveedor
  const handleActualizarProveedor = async () => {
    if (!validarFormulario()) return;

    setUpdating(true);
    setError('');

    try {
      // Preparar FormData
      const formDataToSend = new FormData();
      formDataToSend.append('accion', 'actualizar_proveedor');
      formDataToSend.append('id', id);
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('ruc', formData.ruc);
      formDataToSend.append('categoria', formData.categoria);

      // Procesar imagen solo si se seleccionó una nueva
      if (selectedImage) {
        let imageBase64 = '';
        if (selectedImage.base64) {
          imageBase64 = selectedImage.base64;
        } else if (selectedImage.uri) {
          imageBase64 = await FileSystem.readAsStringAsync(selectedImage.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
        
        if (imageBase64) {
          formDataToSend.append('logo', imageBase64);
        }
      } else {
        // Mantener la imagen actual
        formDataToSend.append('mantener_imagen', '1');
      }

      // Enviar al servidor
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error al actualizar el proveedor');
      }

      Alert.alert('Éxito', 'Proveedor actualizado correctamente', [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]);

    } catch (error) {
      console.error('Error actualizando proveedor:', error);
      const errorMessage = error.message || 'Error al actualizar el proveedor';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#3b82f6" />
      </Container>
    );
  }

  if (!proveedor) {
    return (
      <Container>
        <ErrorText>No se pudo cargar el proveedor</ErrorText>
        <AuthButton onPress={() => router.back()}>
          <ButtonText>Volver</ButtonText>
        </AuthButton>
      </Container>
    );
  }

  return (
    <ScrollContainer>
      <Container>
        <Title>Editar Proveedor</Title>

        {error ? (
          <ErrorText>{error}</ErrorText>
        ) : null}

        {/* Sección de Información Básica */}
        <Card>
          <SectionHeader>Información del Proveedor</SectionHeader>
          
          <Input 
            placeholder="Nombre del proveedor*" 
            value={formData.nombre} 
            onChangeText={(text) => handleChange('nombre', text)} 
          />
          
          <Input 
            placeholder="RUC* (mínimo 4 dígitos)" 
            value={formData.ruc} 
            onChangeText={(text) => handleChange('ruc', text)} 
            keyboardType="numeric"
            maxLength={13}
          />
          
          <Label>CATEGORÍA*</Label>
          <PickerContainer>
            <Picker
              selectedValue={formData.categoria}
              onValueChange={(itemValue) => handleChange('categoria', itemValue)}
            >
              <Picker.Item label="Seleccione una categoría" value="" />
              {categorias.map((cat) => (
                <Picker.Item key={cat.id} label={cat.nombre} value={cat.id.toString()} />
              ))}
            </Picker>
          </PickerContainer>
        </Card>

        {/* Sección de Imagen */}
        <Card>
          <SectionHeader>Logo del Proveedor</SectionHeader>
          
          <ImageSection>
            <ImageButton onPress={pickImage}>
              <IconWrapper>
                <Ionicons name="image" size={20} color="white" />
              </IconWrapper>
              <ButtonText>Cambiar Imagen</ButtonText>
            </ImageButton>
            
            {(selectedImage || currentImage) && (
              <ImagePreview>
                <PreviewImage 
                  source={{ uri: selectedImage?.uri || currentImage }} 
                  resizeMode="cover"
                />
                <RemoveImageButton onPress={() => {
                  setSelectedImage(null);
                  setCurrentImage(null);
                }}>
                  <RemoveImageText>✕</RemoveImageText>
                </RemoveImageButton>
              </ImagePreview>
            )}
          </ImageSection>
        </Card>

        {/* Botones de Acción */}
        <AuthButton onPress={handleActualizarProveedor} disabled={updating}>
          {updating ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <IconWrapper>
                <Ionicons name="save" size={20} color="white" />
              </IconWrapper>
              <ButtonText>Guardar Cambios</ButtonText>
            </>
          )}
        </AuthButton>

        <SecondaryButton onPress={() => router.back()}>
          <ButtonText>Cancelar</ButtonText>
        </SecondaryButton>
      </Container>
    </ScrollContainer>
  );
}

// Estilos (similar al componente AgregarProveedor)
const ScrollContainer = styled(ScrollView)`
  flex: 1;
  background-color: #f8fafc;
`;

const Container = styled(View)`
  flex: 1;
  padding: 30px 25px;
`;

const Title = styled(Text)`
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 30px;
  color: #1e293b;
  letter-spacing: 0.5px;
`;

const Card = styled(View)`
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  shadow-color: #64748b;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.1;
  shadow-radius: 6px;
  elevation: 5;
`;

const Input = styled.TextInput`
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 10px;
  margin-bottom: 18px;
  border: 1px solid #e2e8f0;
  font-size: 16px;
  color: #334155;
`;

const Label = styled(Text)`
  font-size: 15px;
  margin-bottom: 8px;
  color: #475569;
  font-weight: 600;
  margin-left: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PickerContainer = styled(View)`
  background-color: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  margin-bottom: 18px;
  overflow: hidden;
`;

const ImageSection = styled(View)`
  margin-bottom: 25px;
`;

const ImageButton = styled(TouchableOpacity)`
  background-color: #3b82f6;
  padding: 16px 24px;
  border-radius: 10px;
  align-items: center;
  margin-bottom: 15px;
  flex-direction: row;
  justify-content: center;
  shadow-color: #3b82f6;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
  elevation: 3;
`;

const ImagePreview = styled(View)`
  position: relative;
  align-items: center;
  margin-top: 15px;
`;

const PreviewImage = styled(Image)`
  width: 240px;
  height: 240px;
  border-radius: 12px;
  border-width: 1px;
  border-color: #f1f5f9;
`;

const RemoveImageButton = styled(TouchableOpacity)`
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: #ef4444;
  border-radius: 15px;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.2;
  shadow-radius: 2px;
  elevation: 2;
`;

const RemoveImageText = styled(Text)`
  color: white;
  font-weight: bold;
  font-size: 14px;
`;

const AuthButton = styled(TouchableOpacity)`
  background-color: #10b981;
  padding: 18px;
  border-radius: 10px;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 15px;
  shadow-color: #10b981;
  shadow-offset: 0px 3px;
  shadow-opacity: 0.3;
  shadow-radius: 5px;
  elevation: 4;
  flex-direction: row;
  justify-content: center;
  ${props => props.disabled && 'opacity: 0.6;'}
`;

const SecondaryButton = styled(TouchableOpacity)`
  background-color: #f1f5f9;
  padding: 18px;
  border-radius: 10px;
  align-items: center;
  margin-bottom: 15px;
  border-width: 1px;
  border-color: #e2e8f0;
  flex-direction: row;
  justify-content: center;
`;

const ButtonText = styled(Text)`
  color: white;
  font-weight: 600;
  font-size: 17px;
  letter-spacing: 0.5px;
`;

const ErrorText = styled(Text)`
  color: #dc2626;
  font-size: 15px;
  text-align: center;
  margin: 20px 0;
  padding: 15px;
  background-color: #fef2f2;
  border-radius: 8px;
  border-left-width: 4px;
  border-left-color: #dc2626;
`;

const SectionHeader = styled(Text)`
  font-size: 18px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom-width: 1px;
  border-bottom-color: #e2e8f0;
`;

const IconWrapper = styled(View)`
  margin-right: 10px;
`;
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styled } from 'styled-components/native';

// Firebase (solo para autenticación)
import { auth } from '../../../Firebase/firebaseconfig';

// Configuración
const ADMIN_EMAILS = [
  'felipealvaro48@gmail.com',
  'cesarapsricio@gmail.com',
  'christoferj2002@gmail.com'
];
const API_URL = 'https://felipe25.alwaysdata.net/api/modificar-proveedor.php';

export default function ProveedoresScreen() {
  const { step, categoriaId, proveedorId } = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState(step || 'categorias');
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar permisos de administrador
  useEffect(() => {
    const verifyAdmin = async () => {
      const admin = ADMIN_EMAILS.includes(auth.currentUser?.email || '');
      setIsAdmin(admin);
      if (!admin) {
        Alert.alert('Acceso restringido', 'Solo administradores pueden acceder a esta sección');
        router.replace('/');
      }
    };
    verifyAdmin();
  }, []);

  // Cargar categorías
  useEffect(() => {
    if (currentStep === 'categorias' && isAdmin) {
      const loadCategorias = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${API_URL}?accion=obtener_categorias`);
          const data = await response.json();
          if (data.success) {
            setCategorias(data.categorias);
          } else {
            throw new Error('Error al cargar categorías');
          }
        } catch (error) {
          Alert.alert('Error', error.message);
        } finally {
          setLoading(false);
        }
      };
      loadCategorias();
    }
  }, [currentStep, isAdmin]);

  // Cargar proveedores cuando se selecciona categoría
  useEffect(() => {
    if (currentStep === 'proveedores' && categoriaId && isAdmin) {
      const loadProveedores = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${API_URL}?accion=obtener_proveedores_por_categoria&categoria_id=${categoriaId}`);
          const data = await response.json();
          if (data.success) {
            setProveedores(data.proveedores);
          } else {
            throw new Error('Error al cargar proveedores');
          }
        } catch (error) {
          Alert.alert('Error', error.message);
        } finally {
          setLoading(false);
        }
      };
      loadProveedores();
    }
  }, [currentStep, categoriaId, isAdmin]);

  // Cargar proveedor cuando se selecciona para editar
  useEffect(() => {
    if (currentStep === 'editar' && proveedorId && isAdmin) {
      const loadProveedor = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${API_URL}?accion=obtener_proveedor&id=${proveedorId}`);
          const data = await response.json();
          if (data.success && data.proveedor) {
            setProveedor(data.proveedor);
          } else {
            throw new Error('Proveedor no encontrado');
          }
        } catch (error) {
          Alert.alert('Error', error.message);
          setCurrentStep('proveedores');
        } finally {
          setLoading(false);
        }
      };
      loadProveedor();
    }
  }, [currentStep, proveedorId, isAdmin]);

  // Manejadores de eventos
  const handleSelectCategoria = (categoriaId) => {
    setCurrentStep('proveedores');
    router.setParams({ step: 'proveedores', categoriaId });
  };

  const handleSelectProveedor = (proveedorId) => {
    setCurrentStep('editar');
    router.setParams({ step: 'editar', proveedorId });
  };

  const handleBack = () => {
    if (currentStep === 'proveedores') {
      setCurrentStep('categorias');
      router.setParams({ step: 'categorias', categoriaId: undefined });
    } else if (currentStep === 'editar') {
      setCurrentStep('proveedores');
      router.setParams({ step: 'proveedores', proveedorId: undefined });
    }
  };

  const handleSaveProveedor = async (formData, selectedImage, currentImage) => {
    try {
      setLoading(true);
      
      // Preparar FormData para enviar al servidor
      const formDataToSend = new FormData();
      formDataToSend.append('accion', 'actualizar_proveedor');
      formDataToSend.append('id', proveedorId);
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('ruc', formData.ruc);
      formDataToSend.append('categoria', formData.categoria);

      if (selectedImage) {
        // Si hay una nueva imagen seleccionada
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
      } else if (currentImage) {
        // Si se quiere mantener la imagen actual
        formDataToSend.append('mantener_imagen', '1');
      }

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
          onPress: () => handleBack()
        }
      ]);
    } catch (error) {
      console.error('Error actualizando proveedor:', error);
      Alert.alert('Error', error.message || 'Error al actualizar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar paso actual
  const renderStep = () => {
    if (!isAdmin) return null;

    switch (currentStep) {
      case 'categorias':
        return <CategoriasScreen categorias={categorias} loading={loading} onSelectCategoria={handleSelectCategoria} />;
      case 'proveedores':
        return <ProveedoresListScreen proveedores={proveedores} loading={loading} onSelectProveedor={handleSelectProveedor} onBack={handleBack} />;
      case 'editar':
        return (
          <EditarProveedorScreen 
            proveedor={proveedor} 
            loading={loading} 
            onSave={handleSaveProveedor} 
            onBack={handleBack}
            categorias={categorias}
          />
        );
      default:
        return <CategoriasScreen categorias={categorias} loading={loading} onSelectCategoria={handleSelectCategoria} />;
    }
  };

  return (
    <MainContainer>
      {renderStep()}
    </MainContainer>
  );
}

// Componente para pantalla de categorías (sin cambios)
function CategoriasScreen({ categorias, loading, onSelectCategoria }) {
  if (loading) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#3b82f6" />
      </Container>
    );
  }

  return (
    <Container>
      <Title>Seleccione una Categoría</Title>
      <FlatList
        data={categorias}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CategoryCard onPress={() => onSelectCategoria(item.id)}>
            <CategoryName>{item.nombre}</CategoryName>
            <MaterialIcons name="keyboard-arrow-right" size={24} color="#64748b" />
          </CategoryCard>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </Container>
  );
}

// Componente para lista de proveedores (sin cambios)
function ProveedoresListScreen({ proveedores, loading, onSelectProveedor, onBack }) {
  if (loading) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#3b82f6" />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color="#3b82f6" />
        </BackButton>
        <Title>Proveedores</Title>
        <View style={{ width: 24 }} />
      </Header>

      {proveedores.length === 0 ? (
        <EmptyMessage>No hay proveedores en esta categoría</EmptyMessage>
      ) : (
        <FlatList
          data={proveedores}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ProveedorCard onPress={() => onSelectProveedor(item.id)}>
              {item.logo && (
                <ProveedorLogo source={{ uri: item.logo }} />
              )}
              <ProveedorInfo>
                <ProveedorNombre>{item.nombre}</ProveedorNombre>
                <ProveedorRuc>RUC: {item.ruc}</ProveedorRuc>
              </ProveedorInfo>
              <MaterialIcons name="keyboard-arrow-right" size={24} color="#64748b" />
            </ProveedorCard>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </Container>
  );
}

// Componente para editar proveedor (con correcciones)
function EditarProveedorScreen({ proveedor, loading, onSave, onBack, categorias }) {
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    categoria: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [error, setError] = useState('');

  // Inicializar formulario con datos del proveedor
  useEffect(() => {
    if (proveedor) {
      setFormData({
        nombre: proveedor.nombre,
        ruc: proveedor.ruc,
        categoria: proveedor.categoria.toString()
      });
      setCurrentImage(proveedor.logo);
    }
  }, [proveedor]);

  const handleChange = (field, value) => {
    if (field === 'ruc') {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue.length > 13) return;
      value = numericValue;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

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
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Error al seleccionar imagen');
    }
  };

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

    return true;
  };

  const handleSubmit = async () => {
    if (!validarFormulario()) return;

    try {
      await onSave(formData, selectedImage, currentImage);
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  if (loading || !proveedor) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#3b82f6" />
      </Container>
    );
  }

  return (
    <ScrollContainer>
      <Container>
        <Header>
          <BackButton onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color="#3b82f6" />
          </BackButton>
          <Title>Editar Proveedor</Title>
          <View style={{ width: 24 }} />
        </Header>

        {error ? <ErrorText>{error}</ErrorText> : null}

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
                  if (selectedImage) {
                    setSelectedImage(null);
                  } else {
                    Alert.alert(
                      'Eliminar imagen',
                      '¿Estás seguro de eliminar la imagen actual?',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { 
                          text: 'Eliminar', 
                          onPress: () => {
                            setCurrentImage(null);
                            setSelectedImage(null);
                          }
                        }
                      ]
                    );
                  }
                }}>
                  <RemoveImageText>✕</RemoveImageText>
                </RemoveImageButton>
              </ImagePreview>
            )}
          </ImageSection>
        </Card>

        <AuthButton onPress={handleSubmit} disabled={loading}>
          {loading ? (
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
      </Container>
    </ScrollContainer>
  );
}

// Estilos (se mantienen igual)
const MainContainer = styled(View)`
  flex: 1;
  background-color: #f8fafc;
`;

const Container = styled(View)`
  flex: 1;
  padding: 20px;
`;

const ScrollContainer = styled(ScrollView)`
  flex: 1;
  background-color: #f8fafc;
`;

const Title = styled(Text)`
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
  color: #1e293b;
`;

const Header = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const BackButton = styled(TouchableOpacity)`
  padding: 8px;
`;

const CategoryCard = styled(TouchableOpacity)`
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  shadow-color: #64748b;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 2;
`;

const CategoryName = styled(Text)`
  font-size: 16px;
  color: #334155;
`;

const ProveedorCard = styled(TouchableOpacity)`
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  flex-direction: row;
  align-items: center;
  shadow-color: #64748b;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 2;
`;

const ProveedorLogo = styled(Image)`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-right: 16px;
`;

const ProveedorInfo = styled(View)`
  flex: 1;
`;

const ProveedorNombre = styled(Text)`
  font-size: 16px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 4px;
`;

const ProveedorRuc = styled(Text)`
  font-size: 14px;
  color: #64748b;
`;

const EmptyMessage = styled(Text)`
  text-align: center;
  margin-top: 40px;
  font-size: 16px;
  color: #64748b;
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

const SectionHeader = styled(Text)`
  font-size: 18px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom-width: 1px;
  border-bottom-color: #e2e8f0;
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
  flex-direction: row;
  justify-content: center;
  ${props => props.disabled && 'opacity: 0.6;'}
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

const IconWrapper = styled(View)`
  margin-right: 10px;
`;
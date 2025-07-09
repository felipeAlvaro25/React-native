// Importación correcta de hooks comunes
import { useState, useEffect } from 'react';
import { Alert, ScrollView, View, TouchableOpacity, Text, ActivityIndicator, Image, Platform } from 'react-native';
import { styled } from 'styled-components/native';
import { Link, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

// Firebase (solo para autenticación)
import { auth } from '../../../Firebase/firebaseconfig';

// Configuración
const ADMIN_EMAILS = [
  'felipealvaro48@gmail.com',
  'cesarapsricio@gmail.com',
  'christoferj2002@gmail.com'
];
const API_URL = 'https://felipe25.alwaysdata.net/api/modificar-producto.php';

const TALLAS = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL'
];

const COLORES = [
  'Rojo', 'Azul', 'Verde', 'Negro', 'Blanco', 'Amarillo', 
  'Rosa', 'Morado', 'Gris', 'Naranja'
];

const SEXOS = [
  'Caballero', 'Dama'
];

export default function ActualizarProducto() {
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: '',
    color: '',
    talla: '',
    tipo: '',
    marca: '',
    sexo: '',
    status: 1
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [marcas, setMarcas] = useState([]);
  const [loadingMarcas, setLoadingMarcas] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');

  // Verificar permisos de administrador
  if (!ADMIN_EMAILS.includes(auth.currentUser?.email || '')) {
    return (
      <Container>
        <ErrorText>Acceso restringido</ErrorText>
        <AuthButton onPress={() => router.back()}>
          <ButtonText>Volver</ButtonText>
        </AuthButton>
      </Container>
    );
  }

  // Cargar categorías al iniciar
  useEffect(() => {
    const cargarCategorias = async () => {
      setLoadingCategorias(true);
      try {
        const response = await fetch(`${API_URL}?categorias`);
        const data = await response.json();

        if (data.success) {
          setCategorias(data.categorias);
        } else {
          setError(data.message || 'Error al cargar categorías');
        }
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar categorías');
      } finally {
        setLoadingCategorias(false);
      }
    };

    cargarCategorias();
  }, []);

  // Cargar productos por categoría
  useEffect(() => {
    const cargarProductosPorCategoria = async () => {
      if (!formData.categoria) {
        setProductos([]);
        return;
      }
      
      setLoadingProductos(true);
      try {
        const response = await fetch(`${API_URL}?productos_por_categoria&id_categoria=${formData.categoria}`);
        const data = await response.json();

        if (data.success) {
          setProductos(data.productos);
        } else {
          setError(data.message || 'Error al cargar productos');
          setProductos([]);
        }
      } catch (error) {
        console.error('Error al cargar productos:', error);
        setError('Error al conectar con el servidor');
        setProductos([]);
      } finally {
        setLoadingProductos(false);
      }
    };

    cargarProductosPorCategoria();
  }, [formData.categoria]);

  // Cargar proveedores por categoría
  useEffect(() => {
    const cargarProveedoresPorCategoria = async () => {
      if (!formData.categoria) {
        setMarcas([]);
        return;
      }
      
      setLoadingMarcas(true);
      try {
        const response = await fetch(`${API_URL}?proveedores_por_categoria&id_categoria=${formData.categoria}`);
        const data = await response.json();

        if (data.success) {
          setMarcas(data.proveedores);
        } else {
          setError(data.message || 'Error al cargar proveedores');
          setMarcas([]);
        }
      } catch (error) {
        console.error('Error al cargar proveedores:', error);
        setError('Error al conectar con el servidor');
        setMarcas([]);
      } finally {
        setLoadingMarcas(false);
      }
    };

    cargarProveedoresPorCategoria();
  }, [formData.categoria]);

  // Cargar tipos de producto por categoría
  useEffect(() => {
    const cargarTiposPorCategoria = async () => {
      if (!formData.categoria) {
        setTiposProducto([]);
        return;
      }
      
      setLoadingTipos(true);
      try {
        const response = await fetch(`${API_URL}?tipos_por_categoria&id_categoria=${formData.categoria}`);
        const data = await response.json();

        if (data.success) {
          setTiposProducto(data.tipos_productos);
        } else {
          setError(data.message || 'Error al cargar tipos de productos');
          setTiposProducto([]);
        }
      } catch (error) {
        console.error('Error al cargar tipos de productos:', error);
        setError('Error al conectar con el servidor');
        setTiposProducto([]);
      } finally {
        setLoadingTipos(false);
      }
    };

    cargarTiposPorCategoria();
  }, [formData.categoria]);

  // Cargar datos del producto seleccionado
  useEffect(() => {
    if (productoSeleccionado) {
      const producto = productos.find(p => p.id.toString() === productoSeleccionado);
      if (producto) {
        setFormData({
          id: producto.id,
          nombre: producto.nombre || '',
          descripcion: producto.descripcion || '',
          precio: producto.precio?.toString() || '',
          stock: producto.stock?.toString() || '',
          categoria: producto.categoria?.toString() || '',
          color: producto.color || '',
          talla: producto.talla || '',
          tipo: producto.tipo || '',
          marca: producto.marca || '',
          sexo: producto.sexo || '',
          status: producto.status || 1
        });
        setCurrentImageUrl(producto.imagenURL || '');
        setSelectedImage(null);
      }
    }
  }, [productoSeleccionado, productos]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Resetear campos dependientes cuando cambia la categoría
      if (field === 'categoria') {
        newData.marca = '';
        newData.tipo = '';
        setProductoSeleccionado('');
        setCurrentImageUrl('');
        setSelectedImage(null);
        // Resetear todos los campos del producto
        newData.id = '';
        newData.nombre = '';
        newData.descripcion = '';
        newData.precio = '';
        newData.stock = '';
        newData.color = '';
        newData.talla = '';
        newData.sexo = '';
        newData.status = 1;
      }
      
      return newData;
    });
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

      if (Platform.OS === 'web') {
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
      } else {
        Alert.alert(
          'Seleccionar imagen',
          'Elige una opción',
          [
            { text: 'Cámara', onPress: () => openCamera() },
            { text: 'Galería', onPress: () => openGallery() },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Error al seleccionar imagen');
    }
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Error', 'Se necesitan permisos para usar la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Error al abrir la cámara');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Error al abrir la galería');
    }
  };

  const handleActualizarProducto = async () => {
    // Validar que se haya seleccionado un producto
    if (!productoSeleccionado) {
      setError('Debe seleccionar un producto para actualizar');
      return;
    }

    // Validar campos requeridos
    const requiredFields = ['nombre', 'descripcion', 'precio', 'stock', 'categoria'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para enviar
      const productoData = {
        id: formData.id,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: Number(formData.precio),
        stock: Number(formData.stock),
        categoria: formData.categoria,
        color: formData.color || null,
        talla: formData.talla || null,
        tipo: formData.tipo || null,
        sexo: formData.sexo || null,
        status: formData.status || 1,
        marca: formData.marca || null
      };

      // Procesar imagen si se seleccionó una nueva
      if (selectedImage) {
        let imageBase64 = '';
        
        if (Platform.OS === 'web' && selectedImage.base64) {
          imageBase64 = selectedImage.base64;
        } else if (selectedImage.uri) {
          imageBase64 = await FileSystem.readAsStringAsync(selectedImage.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        if (imageBase64) {
          productoData.imagenURL = imageBase64;
          productoData.imagen_tipo = selectedImage.type || 'image/jpeg';
          productoData.nueva_imagen = true;
        }
      }

      // Enviar al servidor
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productoData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Error al actualizar el producto');
      }

      Alert.alert('Éxito', 'Producto actualizado correctamente');
      
      // Recargar la lista de productos
      const reloadResponse = await fetch(`${API_URL}?productos_por_categoria&id_categoria=${formData.categoria}`);
      const reloadData = await reloadResponse.json();
      if (reloadData.success) {
        setProductos(reloadData.productos);
      }

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      Alert.alert('Error', error.message || 'Error al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentImageSource = () => {
    if (selectedImage) {
      return { uri: selectedImage.uri };
    } else if (currentImageUrl) {
      return { uri: `https://felipe25.alwaysdata.net/api/${currentImageUrl}` };
    }
    return null;
  };

  return (
    <ScrollContainer>
      <Container>
        <Title>Actualizar Producto</Title>

        {error && (
          <ErrorText>{error}</ErrorText>
        )}

        {/* Sección de Selección */}
        <Card>
          <SectionHeader>Seleccionar Producto</SectionHeader>
          
          <Label>CATEGORÍA*</Label>
          <PickerContainer>
            {loadingCategorias ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Picker
                selectedValue={formData.categoria}
                onValueChange={(itemValue) => handleChange('categoria', itemValue)}>
                <Picker.Item label="Seleccione una categoría" value="" />
                {categorias.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.nombre} value={cat.id.toString()} />
                ))}
              </Picker>
            )}
          </PickerContainer>

          {formData.categoria && (
            <>
              <Label>PRODUCTO*</Label>
              <PickerContainer>
                {loadingProductos ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Picker
                    selectedValue={productoSeleccionado}
                    onValueChange={(itemValue) => setProductoSeleccionado(itemValue)}
                    enabled={productos.length > 0}>
                    <Picker.Item label="Seleccione un producto" value="" />
                    {productos.map((producto) => (
                      <Picker.Item 
                        key={producto.id} 
                        label={`${producto.nombre} - $${producto.precio}`} 
                        value={producto.id.toString()}
                      />
                    ))}
                  </Picker>
                )}
              </PickerContainer>
              {productos.length === 0 && !loadingProductos && (
                <InfoText>No hay productos disponibles para esta categoría</InfoText>
              )}
            </>
          )}
        </Card>

        {/* Mostrar formulario solo si se seleccionó un producto */}
        {productoSeleccionado && (
          <>
            {/* Sección de Información Básica */}
            <Card>
              <SectionHeader>Información Básica</SectionHeader>
              
              <Input 
                placeholder="Nombre del producto*" 
                value={formData.nombre} 
                onChangeText={(text) => handleChange('nombre', text)} 
              />
              
              <Input 
                placeholder="Descripción*" 
                value={formData.descripcion} 
                onChangeText={(text) => handleChange('descripcion', text)} 
                multiline 
                numberOfLines={3} 
              />
              
              <Input 
                placeholder="Precio* (ej: 19.99)" 
                value={formData.precio} 
                onChangeText={(text) => handleChange('precio', text)} 
                keyboardType="numeric" 
              />
              
              <Input 
                placeholder="Stock disponible*" 
                value={formData.stock} 
                onChangeText={(text) => handleChange('stock', text)} 
                keyboardType="numeric" 
              />
            </Card>

            {/* Sección de Categorización */}
            <Card>
              <SectionHeader>Categorización</SectionHeader>
              
              <Label>TIPO DE PRODUCTO</Label>
              <PickerContainer>
                {loadingTipos ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Picker
                    selectedValue={formData.tipo}
                    onValueChange={(itemValue) => handleChange('tipo', itemValue)}
                    enabled={tiposProducto.length > 0}>
                    <Picker.Item label="Seleccione un tipo" value="" />
                    {tiposProducto.map((tipo) => (
                      <Picker.Item key={tipo.id} label={tipo.tipo} value={tipo.id.toString()} />
                    ))}
                  </Picker>
                )}
              </PickerContainer>

              <Label>MARCA/PROVEEDOR</Label>
              <PickerContainer>
                {loadingMarcas ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Picker
                    selectedValue={formData.marca}
                    onValueChange={(itemValue) => handleChange('marca', itemValue)}
                    enabled={marcas.length > 0}>
                    <Picker.Item label="Seleccione un proveedor" value="" />
                    {marcas.map((proveedor) => (
                      <Picker.Item 
                        key={proveedor.id} 
                        label={proveedor.nombre} 
                        value={proveedor.id.toString()}
                      />
                    ))}
                  </Picker>
                )}
              </PickerContainer>
            </Card>

            {/* Sección de Atributos */}
            <Card>
              <SectionHeader>Atributos</SectionHeader>
              
              <Label>SEXO</Label>
              <PickerContainer>
                <Picker
                  selectedValue={formData.sexo}
                  onValueChange={(itemValue) => handleChange('sexo', itemValue)}>
                  <Picker.Item label="Seleccione un sexo" value="" />
                  {SEXOS.map((sexo) => (
                    <Picker.Item key={sexo} label={sexo} value={sexo} />
                  ))}
                </Picker>
              </PickerContainer>

              <Label>COLOR</Label>
              <PickerContainer>
                <Picker
                  selectedValue={formData.color}
                  onValueChange={(itemValue) => handleChange('color', itemValue)}>
                  <Picker.Item label="Seleccione un color" value="" />
                  {COLORES.map((color) => (
                    <Picker.Item key={color} label={color} value={color} />
                  ))}
                </Picker>
              </PickerContainer>

              <Label>TALLA</Label>
              <PickerContainer>
                <Picker
                  selectedValue={formData.talla}
                  onValueChange={(itemValue) => handleChange('talla', itemValue)}>
                  <Picker.Item label="Seleccione una talla" value="" />
                  {TALLAS.map((talla) => (
                    <Picker.Item key={talla} label={talla} value={talla} />
                  ))}
                </Picker>
              </PickerContainer>

              <Label>ESTADO</Label>
              <PickerContainer>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(itemValue) => handleChange('status', itemValue)}>
                  <Picker.Item label="Activo" value={1} />
                  <Picker.Item label="Inactivo" value={0} />
                </Picker>
              </PickerContainer>
            </Card>

            {/* Sección de Imagen */}
            <Card>
              <SectionHeader>Imagen del Producto</SectionHeader>
              
              <ImageSection>
                <ImageButton onPress={pickImage}>
                  <IconWrapper>
                    <Ionicons name="image" size={20} color="white" />
                  </IconWrapper>
                  <ButtonText>
                    {selectedImage ? 'Cambiar Nueva Imagen' : 'Seleccionar Nueva Imagen'}
                  </ButtonText>
                </ImageButton>
                
                {getCurrentImageSource() && (
                  <ImagePreview>
                    <PreviewImage 
                      source={getCurrentImageSource()} 
                      resizeMode="cover"
                    />
                    {selectedImage && (
                      <RemoveImageButton onPress={() => setSelectedImage(null)}>
                        <RemoveImageText>✕</RemoveImageText>
                      </RemoveImageButton>
                    )}
                    <ImageTypeText>
                      {selectedImage ? 'Nueva imagen seleccionada' : 'Imagen actual'}
                    </ImageTypeText>
                  </ImagePreview>
                )}
              </ImageSection>
            </Card>

            {/* Botón de Acción */}
            <AuthButton onPress={handleActualizarProducto} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <IconWrapper>
                    <Ionicons name="refresh-circle" size={20} color="white" />
                  </IconWrapper>
                  <ButtonText>Actualizar Producto</ButtonText>
                </>
              )}
            </AuthButton>
          </>
        )}

        <Link href="/home" asChild>
          <NavLink>
            <NavLinkText>Volver al inicio</NavLinkText>
          </NavLink>
        </Link>
      </Container>
    </ScrollContainer>
  );
}

// Estilos
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
  min-height: 50px;
  justify-content: center;
`;

const InfoText = styled(Text)`
  color: #6b7280;
  font-size: 12px;
  text-align: center;
  margin-top: -10px;
  margin-bottom: 10px;
  font-style: italic;
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

const ImageTypeText = styled(Text)`
  color: #6b7280;
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
  font-style: italic;
`;

const AuthButton = styled(TouchableOpacity)`
  background-color: #f59e0b;
  padding: 18px;
  border-radius: 10px;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 15px;
  shadow-color: #f59e0b;
  shadow-offset: 0px 3px;
  shadow-opacity: 0.3;
  shadow-radius: 5px;
  elevation: 4;
  flex-direction: row;
  justify-content: center;
`;

const ButtonText = styled(Text)`
  color: white;
  font-weight: 600;
  font-size: 17px;
  letter-spacing: 0.5px;
`;

const NavLink = styled(TouchableOpacity)`
  padding: 12px;
  border-radius: 8px;
  align-items: center;
  margin-top: 15px;
`;

const NavLinkText = styled(Text)`
  color: #6366f1;
  font-weight: 600;
  text-align: center;
  font-size: 16px;
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
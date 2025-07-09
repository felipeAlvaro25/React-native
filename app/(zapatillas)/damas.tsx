import { Link, router } from "expo-router";
import { AntDesign, Entypo, MaterialIcons } from "@expo/vector-icons";
import { styled } from "styled-components/native";
import { FlatList, Alert, Text, TouchableOpacity, View, Image, ActivityIndicator, Animated, Dimensions } from "react-native";
import { auth } from '../../Firebase/firebaseconfig';
import { signOut } from 'firebase/auth';
import { useEffect, useState, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useCart } from '../Contexts/CartContext';
import type { CartItem } from '../Contexts/CartContext';


type AppRoute = "/(admin)" | "/(zapatillas)" | "/(ropa)" | "/(usuario)" | "/(reloj)";

type Ruta = {
    name: string;
    href: AppRoute;
};

// Actualiza el tipo Producto para incluir todos los campos
type Producto = {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    categoria: string;
    imagenURL?: string;
    color?: string;
    talla?: string;
    tipo?: string;
    status?: string;
    comprados?: number;
    marca?: string;
};

type ViewMode = 'single' | 'double';

// Configuración
const ADMIN_EMAILS = [
    'felipealvaro48@gmail.com',
    'cesarapsricio@gmail.coml',  // Reemplaza con el primer correo adicional
    'christoferj2002@gmail.com'   // Reemplaza con el segundo correo adicional
];
const API_URL = 'https://felipe25.alwaysdata.net/api/';
const { width: screenWidth } = Dimensions.get('window');

function Inicio() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('double');
    const [sidebarVisible, setSidebarVisible] = useState(false);

        // Animaciones
    const sidebarAnimation = useRef(new Animated.Value(-screenWidth * 0.8)).current;
    const overlayAnimation = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current; // Declaración añadida
    
    const { state, addItem } = useCart();

    const datarutas: Ruta[] = [
        { name: "Zapatillas", href: "/(zapatillas)" },
        { name: "Ropa", href: "/(ropa)" },
        { name: "Reloj", href: "/(reloj)" },
        { name: "Admin", href: "/(admin)" },
    ];
    

    const animateAddToCart = () => {
    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
    }).start();
    };

    

    const handleAddToCart = (producto: Producto) => {
    console.log('Intentando agregar producto:', producto);
    
    const cartItem = {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagenURL: producto.imagenURL,
        stock: producto.stock,
        categoria: producto.categoria,
        color: producto.color,
        talla: producto.talla,
        marca: producto.marca
    };
    
    addItem(cartItem);
    animateAddToCart();
    
    // Verificación inmediata del estado
    console.log('Estado actual del carrito:', state);
    };

    const handleBuyNow = (producto: Producto) => {
        const cartItem: Omit<CartItem, 'cantidad'> = {
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagenURL: producto.imagenURL,
            stock: producto.stock,
            categoria: producto.categoria,
            color: producto.color,
            talla: producto.talla,
            marca: producto.marca
        };
        
        addItem(cartItem);
        router.navigate('/carrito');
        Alert.alert('Producto listo', `Puedes proceder al pago de ${producto.nombre}`);
    };

    const cargarProductos = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}zapatillas_dama.php`);
            if (!response.ok) throw new Error(`Error HTTP! estado: ${response.status}`);
            
            const data = await response.json();
            console.log('Datos de productos:', data); // Para depuración
            
            if (data.success) {
                setProductos(data.productos.map((p: any) => ({
                    ...p,
                    precio: Number(p.precio),
                    stock: Number(p.stock),
                    // Asegurar que la URL de imagen sea completa
                    imagenURL: p.imagenURL ? 
                        p.imagenURL.startsWith('http') ? 
                            p.imagenURL : 
                            `https://felipe25.alwaysdata.net/api/uploads/productos/${p.imagenURL}`
                        : null
                })));
            } else {
                throw new Error(data.message || 'Error al cargar productos');
            }
        } catch (error) {
            console.error("Error cargando productos:", error);
            Alert.alert('Error', 'No se pudieron cargar los productos');
        } finally {
            setLoading(false);
        }
    };

    const ProductImage = ({ uri, style }: { uri?: string | null, style?: any }) => {
        const [imgError, setImgError] = useState(false);
        
        if (imgError || !uri) {
            return (
                <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
                    <MaterialIcons name="image" size={style?.width ? style.width/3 : 40} color="#ccc" />
                </View>
            );
        }

        return (
            <Image
                source={{ uri }}
                style={style}
                resizeMode="cover"
                onError={() => {
                    console.log('Error cargando imagen:', uri);
                    setImgError(true);
                }}
            />
        );
    };

    // Función para obtener el perfil del usuario
    const fetchUserProfile = async () => {
        if (!auth.currentUser?.uid) return;
        
        try {
            const response = await fetch(`${API_URL}users.php?uid=${auth.currentUser.uid}`);
            const data = await response.json();
            
            if (data.success) {
                setUserProfile(data.user);
            }
        } catch (error) {
            console.error("Error obteniendo perfil:", error);
        }
    };

    useEffect(() => {
        cargarProductos();
        fetchUserProfile();
    }, []);

    // Funciones para abrir y cerrar el sidebar
    const openSidebar = () => {
        setSidebarVisible(true);
        Animated.parallel([
            Animated.timing(sidebarAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(overlayAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeSidebar = () => {
        Animated.parallel([
            Animated.timing(sidebarAnimation, {
                toValue: -screenWidth * 0.8,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(overlayAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setSidebarVisible(false);
        });
    };

    const renderItem = ({ item }: { item: Ruta }) => (
        <Link href={item.href} asChild>
            <SidebarLinkButton onPress={closeSidebar}>
                <SidebarIconContainer>
                    <Primero name="gitlab" size={24} />
                </SidebarIconContainer>
                <SidebarTextContainer>
                    <SidebarTexto>{item.name}</SidebarTexto>
                </SidebarTextContainer>
                <SidebarIconContainer>
                    <Flecha name="arrow-with-circle-right" size={20} />
                </SidebarIconContainer>
            </SidebarLinkButton>
        </Link>
    );

    const renderProductoSingle = ({ item }: { item: Producto }) => (
        <ProductoContainer>
            <ProductoImageContainer>
                <ProductImage 
                    uri={item.imagenURL}
                    style={{ width: '100%', height: '100%' }}
                />
            </ProductoImageContainer>
            <ProductoInfo>
                <ProductoNombre>{item.nombre}</ProductoNombre>
                
                {item.categoria && (
                    <ProductoCategoria>{item.categoria}</ProductoCategoria>
                )}
                
                {item.marca && (
                    <ProductoMarca>Marca: {item.marca}</ProductoMarca>
                )}
                
                <ProductoDescripcion numberOfLines={3}>{item.descripcion}</ProductoDescripcion>
                
                {(item.color || item.talla) && (
                    <ProductoAtributosContainer>
                        {item.color && (
                            <ProductoAtributo>
                                <ProductoColorCircle color={item.color.toLowerCase()} />
                                <ProductoAtributoText>{item.color}</ProductoAtributoText>
                            </ProductoAtributo>
                        )}
                        {item.talla && (
                            <ProductoAtributo>
                                <MaterialIcons name="straighten" size={14} color="#666" />
                                <ProductoAtributoText>{item.talla}</ProductoAtributoText>
                            </ProductoAtributo>
                        )}
                    </ProductoAtributosContainer>
                )}
                
                <ProductoDetailsContainer>
                    <ProductoPrecio>${item.precio.toFixed(2)}</ProductoPrecio>
                    <ProductoStock>Stock: {item.stock}</ProductoStock>
                </ProductoDetailsContainer>
                
                <ProductoButtonsContainer>
                    <TouchableOpacity 
                        onPress={() => handleAddToCart(item)}
                        style={[styles.addToCartButton, { transform: [{ scale: scaleAnim }] }]}
                    >
                        <AddToCartText>Agregar al carrito</AddToCartText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => handleBuyNow(item)}
                        style={styles.buyNowButton}
                    >
                        <BuyNowText>Comprar ahora</BuyNowText>
                    </TouchableOpacity>
                </ProductoButtonsContainer>
            </ProductoInfo>
        </ProductoContainer>
    );

    const renderProductoDouble = ({ item }: { item: Producto }) => (
        <ProductoContainerDouble>
            <ProductoImageContainerDouble>
                <ProductImage 
                    uri={item.imagenURL}
                    style={{ width: '100%', height: '100%' }}
                />
            </ProductoImageContainerDouble>
            <ProductoInfoDouble>
                <ProductoNombreDouble numberOfLines={2}>{item.nombre}</ProductoNombreDouble>
                
                {item.categoria && (
                    <ProductoCategoriaDouble>{item.categoria}</ProductoCategoriaDouble>
                )}
                
                <ProductoDescripcionDouble numberOfLines={2}>{item.descripcion}</ProductoDescripcionDouble>
                
                <ProductoDetailsContainerDouble>
                    <ProductoPrecioDouble>${item.precio.toFixed(2)}</ProductoPrecioDouble>
                    <ProductoStockDouble>Stock: {item.stock}</ProductoStockDouble>
                </ProductoDetailsContainerDouble>
                
                <ProductoButtonsContainerDouble>
                    <TouchableOpacity 
                        onPress={() => handleAddToCart(item)}
                        style={[styles.addToCartButtonDouble, { transform: [{ scale: scaleAnim }] }]}
                    >
                        <MaterialIcons name="add-shopping-cart" size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => handleBuyNow(item)}
                        style={styles.buyNowButtonDouble}
                    >
                        <MaterialIcons name="flash-on" size={16} color="white" />
                    </TouchableOpacity>
                </ProductoButtonsContainerDouble>
            </ProductoInfoDouble>
        </ProductoContainerDouble>
    );

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUserProfile(null);
            Alert.alert('Éxito', 'Sesión cerrada correctamente');
            router.replace('/');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };
        return (
        <>
            <GradientBackground />
            <BlurredOverlay />
            <MainContainer>
                <MainScrollView showsVerticalScrollIndicator={false}>
                    <Container>
                        {/* Header Section con botón de menú */}
                        <HeaderSection>
                            <HeaderTopRow>
                                <MenuButton onPress={openSidebar}>
                                    <MaterialIcons name="menu" size={28} color="white" />
                                </MenuButton>
                                <SignOutButton onPress={handleSignOut}>
                                    <ButtonText>Cerrar sesión</ButtonText>
                                    <AntDesign name="logout" size={18} color="white" style={{ marginLeft: 8 }} />
                                </SignOutButton>
                            </HeaderTopRow>
                            <WelcomeText>
                                ¡Bienvenido {userProfile?.nombre || auth.currentUser?.email}!
                            </WelcomeText>
                        </HeaderSection>
                        
                        {/* Products Section */}
                        <SectionContainer>
                            <SectionHeader>
                                <Titulo>Zapatillas de Damas Disponibles</Titulo>
                                <ViewModeContainer>
                                    <ViewModeButton 
                                        active={viewMode === 'single'}
                                        onPress={() => setViewMode('single')}
                                    >
                                        <MaterialIcons 
                                            name="view-agenda" 
                                            size={18} 
                                            color={viewMode === 'single' ? '#fff' : '#666'} 
                                        />
                                        <ViewModeText active={viewMode === 'single'}>
                                            Una columna
                                        </ViewModeText>
                                    </ViewModeButton>
                                    
                                    <ViewModeButton 
                                        active={viewMode === 'double'}
                                        onPress={() => setViewMode('double')}
                                    >
                                        <MaterialIcons 
                                            name="view-module" 
                                            size={18} 
                                            color={viewMode === 'double' ? '#fff' : '#666'} 
                                        />
                                        <ViewModeText active={viewMode === 'double'}>
                                            Dos columnas
                                        </ViewModeText>
                                    </ViewModeButton>
                                </ViewModeContainer>
                            </SectionHeader>
                            
                            {loading ? (
                                <LoadingContainer>
                                    <ActivityIndicator size="large" color="#ffffff" />
                                    <LoadingText>Cargando productos...</LoadingText>
                                </LoadingContainer>
                            ) : productos.length > 0 ? (
                                <ProductsList 
                                    data={productos}
                                    renderItem={viewMode === 'single' ? renderProductoSingle : renderProductoDouble}
                                    keyExtractor={(item) => item.id.toString()}
                                    numColumns={viewMode === 'double' ? 2 : 1}
                                    key={viewMode}
                                    columnWrapperStyle={viewMode === 'double' ? { justifyContent: 'space-between' } : undefined}
                                    showsVerticalScrollIndicator={false}
                                    scrollEnabled={false}
                                />
                            ) : (
                                <NoProductsText>No hay productos disponibles</NoProductsText>
                            )}
                        </SectionContainer>
                        
                        {/* Footer */}
                        <FooterContainer>
                            <AntDesign name="gitlab" size={60} color="#E24329"/>
                        </FooterContainer>
                    </Container>
                </MainScrollView>
                
                {/* Barra de navegación inferior */}
                <BottomTabBar>
                    {/* Botón de Inicio */}
                    <TabButton onPress={() => { router.navigate('/'); }}>
                    <MaterialIcons name="home" size={24} color="#fff" />
                    <TabButtonText>Inicio</TabButtonText>
                    </TabButton>

                    {/* Botón de Perfil */}
                    <TabButton onPress={() => { router.navigate('/perfil'); }}> {/* Asume una ruta /profile para el perfil */}
                    <MaterialIcons name="person" size={24} color="#fff" />
                    <TabButtonText>Perfil</TabButtonText>
                    </TabButton>

                    {/* Botón de Buscar */}
                    <TabButton onPress={() => { router.navigate('/historial'); }}> {/* Asume una ruta /search para buscar */}
                    <MaterialIcons name="search" size={24} color="#fff" />
                    <TabButtonText>historial</TabButtonText>
                    </TabButton>

                    {/* Botón de Carrito */}
                    <TabButton onPress={() => router.navigate('/carrito')}>
                        <View style={{ position: 'relative' }}>
                            <MaterialIcons name="shopping-cart" size={24} color="#fff" />
                            {state.itemCount > 0 && (
                                <View style={{
                                    position: 'absolute',
                                    right: -8,
                                    top: -4,
                                    backgroundColor: '#E24329',
                                    borderRadius: 10,
                                    width: 18,
                                    height: 18,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                                        {state.itemCount > 9 ? '9+' : state.itemCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <TabButtonText>Carrito</TabButtonText>
                    </TabButton>
                </BottomTabBar>
            </MainContainer>

            {/* Sidebar Overlay y Sidebar */}
            {sidebarVisible && (
                <>
                    <SidebarOverlay 
                        as={Animated.View}
                        style={{ opacity: overlayAnimation }}
                        onTouchEnd={closeSidebar}
                        activeOpacity={1}
                    />
                    <SidebarContainer
                        as={Animated.View}
                        style={{
                            transform: [{ translateX: sidebarAnimation }]
                        }}
                    >
                        <SidebarHeader>
                            <SidebarCloseButton onPress={closeSidebar}>
                                <MaterialIcons name="close" size={28} color="white" />
                            </SidebarCloseButton>
                            <SidebarTitle>Menú</SidebarTitle>
                        </SidebarHeader>
                        
                        <SidebarContent>
                            
                            <SidebarMenuList 
                                data={datarutas} 
                                renderItem={renderItem} 
                                keyExtractor={(item) => item.name}
                                scrollEnabled={false}
                            />
                        </SidebarContent>
                        
                        <SidebarFooter>
                            <AntDesign name="gitlab" size={40} color="#E24329"/>
                        </SidebarFooter>
                    </SidebarContainer>
                </>
            )}
        </>
    );
}
export default Inicio; // Agregar esta línea al final del archivo

const ProductoCategoria = styled(Text)`
    font-size: 12px;
    color: #666;
    background-color: #f0f0f0;
    padding: 2px 8px;
    border-radius: 10px;
    align-self: flex-start;
    margin-bottom: 5px;
`;

const ProductoCategoriaDouble = styled(Text)`
    font-size: 10px;
    color: #666;
    background-color: #f0f0f0;
    padding: 2px 6px;
    border-radius: 8px;
    align-self: flex-start;
    margin-bottom: 4px;
`;


const ProductoMarca = styled(Text)`
    font-size: 12px;
    color: #555;
    margin-bottom: 5px;
`;

const ProductoAtributosContainer = styled(View)`
    flex-direction: row;
    margin-vertical: 5px;
    flex-wrap: wrap;
`;

const ProductoAtributo = styled(View)`
    flex-direction: row;
    align-items: center;
    margin-right: 10px;
    margin-bottom: 5px;
    background-color: #f5f5f5;
    padding: 3px 8px;
    border-radius: 10px;
`;

const ProductoAtributoText = styled(Text)`
    font-size: 12px;
    color: #666;
    margin-left: 4px;
`;

const ProductoColorCircle = styled(View)<{ color: string }>`
    width: 14px;
    height: 14px;
    border-radius: 7px;
    background-color: ${props => props.color};
    border: 1px solid #ddd;
`;

// Contenedor con degradado
const GradientBackground = styled(LinearGradient).attrs({
  colors: [
  'rgba(80, 20, 20, 0.8)',   // rojo quemado
  'rgba(0, 0, 0, 0.85)',  // carbón
  'rgba(67, 29, 29, 0.9)',      // negro lava
'rgba(67, 55, 29, 0.9)'       // negro lava
  ],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
})`
  flex: 1;
  position: absolute;
  width: 100%;
  height: 100%;
`;

// Capa de blur encima del degradado
const BlurredOverlay = styled(BlurView).attrs({
  intensity: 40,
  tint: 'default', // o 'dark' si el fondo queda claro
})`
  flex: 1;
  position: absolute;
  width: 100%;
  height: 100%;
`;

// Scroll principal
const MainScrollView = styled.ScrollView`
    flex: 1;
    z-index: 1;
    margin-bottom: 60px;
`;

const Container = styled(View)`
    flex: 1;
    padding-bottom: 5px;
`;

const HeaderSection = styled(View)`
    padding: 20px;
    padding-top: 40px;
    background-color: rgba(26, 3, 51, 0.57);
`;

const HeaderTopRow = styled(View)`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
`;

const MenuButton = styled(TouchableOpacity)`
    padding: 8px;
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.2);
`;

const SectionContainer = styled(View)`
    padding: 20px;
`;

const SectionHeader = styled(View)`
    align-items: center;
    margin-bottom: 20px;
`;

const WelcomeText = styled(Text)`
    font-size: 18px;
    color: white;
    font-weight: 600;
    text-align: center;
`;

const SignOutButton = styled(TouchableOpacity)`
    background-color: #d32f2f;
    padding: 12px 20px;
    border-radius: 25px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    min-width: 150px;
    height: 45px;
`;

const ButtonText = styled(Text)`
    color: white;
    font-weight: 600;
    font-size: 16px;
`;

const Titulo = styled(Text)`
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 15px;
    color: rgba(3, 7, 7, 0.8);
    text-align: center;
`;

const ViewModeContainer = styled(View)`
    flex-direction: row;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 4px;
    margin-bottom: 15px;
`;

const ViewModeButton = styled(TouchableOpacity)<{ active: boolean }>`
    flex-direction: row;
    align-items: center;
    padding: 10px 16px;
    border-radius: 18px;
    background-color: ${props => props.active ? 'rgba(0, 0, 0, 0.8)' : 'transparent'};
    margin: 0 2px;
`;

const ViewModeText = styled(Text)<{ active: boolean }>`
    color: ${props => props.active ? '#fff' : '#666'};
    font-weight: ${props => props.active ? '600' : '400'};
    margin-left: 6px;
    font-size: 13px;
`;

// Estilos del Sidebar
const SidebarOverlay = styled(TouchableOpacity)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
`;

const SidebarContainer = styled(View)`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: ${screenWidth * 0.8}px;
    background-color: rgba(26, 3, 51, 0.92);
    z-index: 1001;
    shadow-color: #000;
    shadow-offset: 2px 0px;
    shadow-opacity: 0.3;
    shadow-radius: 10px;
    elevation: 10;
`;

const SidebarHeader = styled(View)`
    flex-direction: row;
    align-items: center;
    padding: 20px;
    padding-top: 50px;
    background-color: rgba(26, 3, 51, 0.57);
    border-bottom-width: 5px;
    border-bottom-color: rgb(138, 8, 8);
`;

const SidebarCloseButton = styled(TouchableOpacity)`
    padding: 8px;
    margin-right: 15px;
`;

const SidebarTitle = styled(Text)`
    font-size: 24px;
    font-weight: bold;
    color: white;
`;

const SidebarContent = styled(View)`
    flex: 1;
    padding: 20px;
`;

const SidebarFooter = styled(View)`
    align-items: center;
    justify-content: center;
    padding: 20px;
    border-top-width: 1px;
    border-top-color: rgba(255, 255, 255, 0.2);
`;

// Botones del sidebar
const SidebarLinkButton = styled(TouchableOpacity)`
    flex-direction: row;
    align-items: center;
    padding: 16px;
    margin-bottom: 12px;
    border-radius: 12px;
    background-color: rgba(255, 255, 255, 0.1);
    height: 60px;
`;


const SidebarIconContainer = styled(View)`
    width: 40px;
    align-items: center;
    justify-content: center;
`;

const SidebarTextContainer = styled(View)`
    flex: 1;
    align-items: flex-start;
    justify-content: center;
    margin-left: 10px;
`;

const SidebarTexto = styled(Text)`
    font-size: 16px;
    font-weight: 600;
    text-transform: capitalize;
    color: white;
`;

const SidebarMenuList = styled(FlatList)`
    flex-grow: 0;
`;

const Flecha = styled(Entypo)`
    color: rgba(255, 255, 255, 0.8);
`;

const Primero = styled(AntDesign)`
    color: rgba(239, 16, 16, 0.88);
`;

const ProductoContainer = styled(LinearGradient).attrs({
  colors: ['rgba(123, 142, 138, 0.85)', 'rgba(64, 28, 75, 0.85)'], // tus dos colores
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
})`
  flex-direction: row;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
  min-height: 140px;
`;

const ProductoImageContainer = styled(View)`
    width: 120px;
    height: 120px;
    margin-right: 16px;
    background-color: #f5f5f5;
    border-radius: 10px;
    overflow: hidden;
`;

const ProductoInfo = styled(View)`
    flex: 1;
    justify-content: space-between;
    padding-vertical: 4px;
`;

const ProductoNombre = styled(Text)`
    font-size: 17px;
    font-weight: bold;
    color: #333;
    line-height: 22px;
`;

const ProductoDescripcion = styled(Text)`
    font-size: 14px;
    color: #666;
    line-height: 18px;
    margin-vertical: 8px;
`;

const ProductoDetailsContainer = styled(View)`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
`;

const ProductoPrecio = styled(Text)`
    font-size: 18px;
    font-weight: bold;
    color: #E24329;
`;

const ProductoStock = styled(Text)`
    font-size: 13px;
    color: #4CAF50;
    font-weight: 500;
    background-color: #E8F5E8;
    padding: 4px 8px;
    border-radius: 12px;
`;

// Estilos mejorados para productos - Vista double
const ProductoContainerDouble = styled(View)`
    background-color:rgba(63, 43, 150, 0.29);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
    shadow-color: #000;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.1;
    shadow-radius: 3px;
    elevation: 3;
    width: 47%;
    min-height: 350px;
`;


const ProductoImageContainerDouble = styled(View)`
    width: 100%;
    height: 150px;
    margin-bottom: 12px;
    background-color: #f5f5f5;
    border-radius: 8px;
    overflow: hidden;
`;

const ProductoInfoDouble = styled(View)`
    flex: 1;
    justify-content: space-between;
`;

const ProductoNombreDouble = styled(Text)`
    font-size: 14px;
    font-weight: bold;
    color: #333;
    margin-bottom: 6px;
    line-height: 18px;
`;

const ProductoDescripcionDouble = styled(Text)`
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
    line-height: 16px;
`;

const ProductoDetailsContainerDouble = styled(View)`
    margin-top: auto;
`;

const ProductoPrecioDouble = styled(Text)`
    font-size: 16px;
    font-weight: bold;
    color: #E24329;
    margin-bottom: 4px;
`;


const ProductoStockDouble = styled(Text)`
    font-size: 11px;
    color: #4CAF50;
    font-weight: 500;
    background-color: #E8F5E8;
    padding: 3px 6px;
    border-radius: 10px;
    align-self: flex-start;
`;

const ProductsList = styled(FlatList)`
    flex-grow: 0;
`;

const LoadingContainer = styled(View)`
    align-items: center;
    justify-content: center;
    padding: 40px 0;
`;

const LoadingText = styled(Text)`
    font-size: 16px;
    color: white;
    margin-top: 10px;
`;

const NoProductsText = styled(Text)`
    font-size: 16px;
    color: white;
    text-align: center;
    padding: 40px 0;
`;

const FooterContainer = styled(View)`
    align-items: center;
    justify-content: center;
    padding: 20px;
`;

// Estilos para los botones (vista single)
const ProductoButtonsContainer = styled(View)`
    flex-direction: row;
    justify-content: space-between;
    margin-top: 10px;
    z-index: 2;
`;


const styles = {
  addToCartButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buyNowButton: {
    backgroundColor: '#E24329',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addToCartButtonDouble: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buyNowButtonDouble: {
    backgroundColor: '#E24329',
    padding: 8,
    borderRadius: 6,
    flex: 1,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center'
  }
};

const AddToCartText = styled(Text)`
    color: white;
    font-weight: 600;
    font-size: 14px;
`;

const BuyNowText = styled(Text)`
    color: white;
    font-weight: 600;
    font-size: 14px;
`;

// Estilos para los botones (vista double)
const ProductoButtonsContainerDouble = styled(View)`
    flex-direction: row;
    justify-content: space-between;
    margin-top: 10px;
    z-index: 2;
`;

const MainContainer = styled(View)`
    flex: 1;
`;

const BottomTabBar = styled(View)`
    flex-direction: row;
    height: 60px;
    background-color:rgba(26, 3, 51, 0.57);
    border-top-width: 1px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    border-top-color: rgba(255, 255, 255, 0.2);
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
`;

const TabButton = styled(TouchableOpacity)`
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 5px 0;
    background-color: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
`;

const TabButtonText = styled(Text)`
    color: white;
    font-size: 12px;
    margin-top: 4px;
    font-weight: ${props => props.active ? 'bold' : 'normal'};
`;
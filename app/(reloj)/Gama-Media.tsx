import { AntDesign, Entypo, MaterialIcons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from "expo-router";
import { signOut } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { styled } from "styled-components/native";
import { auth } from '../../Firebase/firebaseconfig';

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
    
    // Animación para el sidebar
    const sidebarAnimation = useRef(new Animated.Value(-screenWidth * 0.8)).current;
    const overlayAnimation = useRef(new Animated.Value(0)).current;

    const datarutas: Ruta[] = [
        { name: "Zapatillas", href: "/(zapatillas)" },
        { name: "Ropa", href: "/(ropa)" },
        { name: "Reloj", href: "/(reloj)" },
        { name: "Admin", href: "/(admin)" },
    ];
    
    const cargarProductos = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}reloj.php`);
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

    const handleAddToCart = (producto: Producto) => {
        Alert.alert('Producto agregado', `Se agregó ${producto.nombre} al carrito`);
        // Aquí puedes implementar la lógica para agregar al carrito
    };

    const handleBuyNow = (producto: Producto) => {
        Alert.alert('Compra rápida', `Redirigiendo a compra de ${producto.nombre}`);
        // Aquí puedes implementar la lógica para compra inmediata
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

    // Vista de un producto por fila (mejorada)
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
                    <AddToCartButton onPress={() => handleAddToCart(item)}>
                        <AddToCartText>Agregar al carrito</AddToCartText>
                    </AddToCartButton>
                    <BuyNowButton onPress={() => handleBuyNow(item)}>
                        <BuyNowText>Comprar ahora</BuyNowText>
                    </BuyNowButton>
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
                    <AddToCartButtonDouble onPress={() => handleAddToCart(item)}>
                        <MaterialIcons name="add-shopping-cart" size={16} color="white" />
                    </AddToCartButtonDouble>
                    <BuyNowButtonDouble onPress={() => handleBuyNow(item)}>
                        <MaterialIcons name="flash-on" size={16} color="white" />
                    </BuyNowButtonDouble>
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
                                <Titulo>Relojes Gama Media  Disponibles</Titulo>
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
                    <TabButton onPress={() => {}}>
                        <MaterialIcons name="home" size={24} color="#fff" />
                        <TabButtonText>Inicio</TabButtonText>
                    </TabButton>
                    
                    <TabButton onPress={() => {}}>
                        <MaterialIcons name="person" size={24} color="#fff" />
                        <TabButtonText>Perfil</TabButtonText>
                    </TabButton>
                    
                    <TabButton onPress={() => {}}>
                        <MaterialIcons name="search" size={24} color="#fff" />
                        <TabButtonText>Buscar</TabButtonText>
                    </TabButton>
                    
                    <TabButton onPress={() => {}}>
                        <MaterialIcons name="shopping-cart" size={24} color="#fff" />
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
    color: #333333; /* Gris oscuro */
    background-color: #e0e0e0; /* Gris claro */
    padding: 2px 8px;
    border-radius: 10px;
    align-self: flex-start;
    margin-bottom: 5px;
    overflow: hidden; /* Evita que el fondo se salga del borde redondeado */
`;

const ProductoCategoriaDouble = styled(Text)`
    font-size: 10px;
    color: #333333; /* Gris oscuro */
    background-color: #e0e0e0; /* Gris claro */
    padding: 2px 6px;
    border-radius: 8px;
    align-self: flex-start;
    margin-bottom: 4px;
    overflow: hidden;
`;

const ProductoMarca = styled(Text)`
    font-size: 12px;
    color: #555555; /* Gris medio */
    margin-bottom: 5px;
`;

// Atributos del producto
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
    background-color: #f5f5f5; /* Gris muy claro */
    padding: 3px 8px;
    border-radius: 10px;
`;

const ProductoAtributoText = styled(Text)`
    font-size: 12px;
    color: #444444; /* Gris oscuro */
    margin-left: 4px;
`;

const ProductoColorCircle = styled(View)<{ color: string }>`
    width: 14px;
    height: 14px;
    border-radius: 7px;
    background-color: ${props => props.color};
    border: 1px solid #b0b0b0; /* Borde gris */
`;

// Degradado de fondo principal
const GradientBackground = styled(LinearGradient).attrs({
  colors: [
    'rgba(176, 196, 222, 0.85)', // Gris acero claro
    'rgba(119, 136, 153, 0.85)', // Gris pizarra
    'rgba(169, 169, 169, 0.9)', // Gris oscuro
    'rgba(211, 211, 211, 0.9)'  // Gris claro (LightGrey)
  ],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
})`
  flex: 1;
  position: absolute;
  width: 100%;
  height: 100%;
`;

// Blur encima del degradado
const BlurredOverlay = styled(BlurView).attrs({
  intensity: 50,
  tint: 'light',
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

// Contenedor general
const Container = styled(View)`
    flex: 1;
    padding-bottom: 5px;
`;

// Header y top bar
const HeaderSection = styled(View)`
    padding: 20px;
    padding-top: 40px;
    background-color: rgba(119, 136, 153, 0.5); /* Gris pizarra traslúcido */
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
    background-color: rgba(105, 105, 105, 0.3); /* Gris oscuro traslúcido */
`;

// Sección general
const SectionContainer = styled(View)`
    padding: 20px;
`;

const SectionHeader = styled(View)`
    align-items: center;
    margin-bottom: 20px;
`;

const WelcomeText = styled(Text)`
    font-size: 18px;
    color: #f0f0f0; /* Blanco grisáceo */
    font-weight: 600;
    text-align: center;
`;

// Botón cerrar sesión
const SignOutButton = styled(TouchableOpacity)`
    background-color: #808080; /* Gris */
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

// Títulos
const Titulo = styled(Text)`
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 15px;
    color: rgba(245, 245, 245, 0.95); /* Blanco humo */
    text-align: center;
`;

// Contenedor para modo vista
const ViewModeContainer = styled(View)`
    flex-direction: row;
    background-color: rgba(128, 128, 128, 0.3); /* Gris traslúcido */
    border-radius: 20px;
    padding: 4px;
    margin-bottom: 15px;
`;

const ViewModeButton = styled(TouchableOpacity)<{ active: boolean }>`
    flex-direction: row;
    align-items: center;
    padding: 10px 16px;
    border-radius: 18px;
    background-color: ${props => props.active ? 'rgba(112, 128, 144, 0.9)' : 'transparent'}; /* Gris pizarra */
    margin: 0 2px;
`;

const ViewModeText = styled(Text)<{ active: boolean }>`
    color: ${props => props.active ? '#FFFFFF' : '#E0E0E0'}; /* Blanco y gris claro */
    font-weight: ${props => props.active ? '600' : '400'};
    margin-left: 6px;
    font-size: 13px;
`;

// Sidebar
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
    background-color: rgba(70, 80, 90, 0.95); /* Gris azulado oscuro */
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
    background-color: rgba(119, 136, 153, 0.5); /* Gris pizarra traslúcido */
    border-bottom-width: 5px;
    border-bottom-color: #C0C0C0; /* Plata */
`;

const SidebarCloseButton = styled(TouchableOpacity)`
    padding: 8px;
    margin-right: 15px;
`;

const SidebarTitle = styled(Text)`
    font-size: 24px;
    font-weight: bold;
    color: #F5F5F5; /* Blanco humo */
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
    border-top-color: rgba(192, 192, 192, 0.2); /* Plata traslúcido */
`;

const SidebarLinkButton = styled(TouchableOpacity)`
    flex-direction: row;
    align-items: center;
    padding: 16px;
    margin-bottom: 12px;
    border-radius: 12px;
    background-color: rgba(192, 192, 192, 0.15); /* Plata traslúcido */
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
    color: #F5F5F5; /* Blanco humo */
`;

const SidebarMenuList = styled(FlatList)`
    flex-grow: 0;
`;

const Flecha = styled(Entypo)`
    color: rgba(220, 220, 220, 0.8); /* Gris claro */
`;

const Primero = styled(AntDesign)`
    color: rgba(192, 192, 192, 0.88); /* Plata */
`;

// Producto - vista simple
const ProductoContainer = styled(LinearGradient).attrs({
  colors: ['rgba(211, 211, 211, 0.85)', 'rgba(169, 169, 169, 0.85)'], // Degradado de grises
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
    background-color: #FFFFFF; /* Fondo blanco */
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
    color: #333333; /* Gris oscuro */
    line-height: 22px;
`;

const ProductoDescripcion = styled(Text)`
    font-size: 14px;
    color: #555555; /* Gris medio */
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
    color: #000000; /* Negro para mayor contraste */
`;

const ProductoStock = styled(Text)`
    font-size: 13px;
    color: #2E8B57; /* Verde mar */
    font-weight: 500;
    background-color: #E0E0E0; /* Fondo gris claro */
    padding: 4px 8px;
    border-radius: 12px;
    overflow: hidden;
`;

// Producto - vista doble
const ProductoContainerDouble = styled(View)`
    background-color:rgba(211, 211, 211, 0.3); /* Gris claro traslúcido */
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
    background-color: #FFFFFF; /* Fondo blanco */
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
    color: #333333; /* Gris oscuro */
    margin-bottom: 6px;
    line-height: 18px;
`;

const ProductoDescripcionDouble = styled(Text)`
    font-size: 12px;
    color: #666666; /* Gris medio */
    margin-bottom: 8px;
    line-height: 16px;
`;

const ProductoDetailsContainerDouble = styled(View)`
    margin-top: auto;
`;

const ProductoPrecioDouble = styled(Text)`
    font-size: 16px;
    font-weight: bold;
    color: #000000; /* Negro */
    margin-bottom: 4px;
`;

const ProductoStockDouble = styled(Text)`
    font-size: 11px;
    color: #2E8B57; /* Verde mar */
    font-weight: 500;
    background-color: #E0E0E0; /* Gris claro */
    padding: 3px 6px;
    border-radius: 10px;
    align-self: flex-start;
    overflow: hidden;
`;

// Lista de productos
const ProductsList = styled(FlatList)``;

// Contenedor para carga y textos
const LoadingContainer = styled(View)`
    align-items: center;
    justify-content: center;
    padding: 40px 0;
`;

const LoadingText = styled(Text)`
    font-size: 16px;
    color: #DDDDDD; /* Gris muy claro */
    margin-top: 10px;
`;

const NoProductsText = styled(Text)`
    font-size: 16px;
    color: #DDDDDD; /* Gris muy claro */
    text-align: center;
    padding: 40px 0;
`;

const FooterContainer = styled(View)`
    align-items: center;
    justify-content: center;
    padding: 20px;
`;

// Botones (vista single)
const ProductoButtonsContainer = styled(View)`
    flex-direction: row;
    justify-content: space-between;
    margin-top: 10px;
`;

const AddToCartButton = styled(TouchableOpacity)`
    background-color: #808080; /* Gris */
    padding: 10px 15px;
    border-radius: 8px;
    flex: 1;
    margin-right: 8px;
    align-items: center;
    justify-content: center;
`;

const BuyNowButton = styled(TouchableOpacity)`
    background-color: #696969; /* Gris oscuro */
    padding: 10px 15px;
    border-radius: 8px;
    flex: 1;
    margin-left: 8px;
    align-items: center;
    justify-content: center;
`;

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

// Botones (vista double)
const ProductoButtonsContainerDouble = styled(View)`
    flex-direction: row;
    justify-content: space-between;
    margin-top: 10px;
`;

const AddToCartButtonDouble = styled(TouchableOpacity)`
    background-color: #808080; /* Gris */
    padding: 8px;
    border-radius: 6px;
    flex: 1;
    margin-right: 4px;
    align-items: center;
    justify-content: center;
`;

const BuyNowButtonDouble = styled(TouchableOpacity)`
    background-color: #696969; /* Gris oscuro */
    padding: 8px;
    border-radius: 6px;
    flex: 1;
    margin-left: 4px;
    align-items: center;
    justify-content: center;
`;

// Contenedor principal
const MainContainer = styled(View)`
    flex: 1;
`;

// Barra inferior de pestañas
const BottomTabBar = styled(View)`
    flex-direction: row;
    height: 60px;
    background-color: rgba(119, 136, 153, 0.8); /* Gris pizarra traslúcido */
    border-top-width: 1px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    border-top-color: rgba(192, 192, 192, 0.3); /* Plata traslúcido */
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
`;

const TabButton = styled(TouchableOpacity)<{ active?: boolean }>`
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 5px 0;
    background-color: ${props => props.active ? 'rgba(192, 192, 192, 0.3)' : 'transparent'};
`;

const TabButtonText = styled(Text)<{ active?: boolean }>`
    color: #F5F5F5; /* Blanco humo */
    font-size: 12px;
    margin-top: 4px;
    font-weight: ${props => props.active ? 'bold' : 'normal'};
`;

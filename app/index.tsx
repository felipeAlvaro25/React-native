import { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, ScrollView } from 'react-native';
import { styled } from 'styled-components/native';
import { Link, router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { FirebaseError } from 'firebase/app';

// Firebase imports
import { auth } from '../Firebase/firebaseconfig';
import { initializeDatabase } from '../Firebase/Firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';

// Configuración
const ADMIN_EMAILS = [
  'felipealvaro48@gmail.com',
  'admin1@example.com',  // Reemplaza con el primer correo adicional
  'admin2@example.com'   // Reemplaza con el segundo correo adicional
];
const API_URL = 'https://felipe25.alwaysdata.net/api/';

interface FormData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  usuario: string;
  edad: string;
  direccion: string;
}

interface UserProfile {
  firebase_uid: string;
  email: string;
  nombre: string;
  apellido: string;
  usuario: string;
  edad?: number;
  direccion?: string;
}

export default function AuthScreen() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    usuario: '',
    edad: '',
    direccion: ''
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [databaseStatus, setDatabaseStatus] = useState<string>('Verificando base de datos...');

  useEffect(() => {
    let unsubscribe: () => void;
    
    const initApp = async () => {
      try {
        // 1. Verificar y crear tablas si es necesario
        await validateAndCreateTables();
        
        // 2. Inicializar Firebase
        await initializeDatabase();
        
        // 3. Configurar listener de autenticación
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          setUser(user);
          if (user) {
            // Obtener perfil del usuario desde alwaysData
            await fetchUserProfile(user.uid);
            router.replace('/home');
          }
          setLoading(false);
        });
        
      } catch (err) {
        console.error("App init error:", err);
        setError("Error al inicializar la aplicación");
        setLoading(false);
      }
    };

    initApp();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

const validateAndCreateTables = async () => {
  try {
    setDatabaseStatus('Verificando estructura de la base de datos...');
    
    // Llamar al endpoint que valida y crea tablas
    const response = await fetch(`${API_URL}creacion.php`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      setDatabaseStatus('Base de datos lista');
      console.log('Database validation:', data.message);
      
      // Mostrar información de debug si es necesario
      if (data.data.faltantes && data.data.faltantes.length > 0) {
        console.log('Tablas creadas:', data.data.faltantes);
      }
    } else {
      throw new Error(data.message || 'Error al validar la base de datos');
    }
  } catch (error) {
    console.error('Error validating database:', error);
    setError('Error al validar la base de datos');
    setDatabaseStatus('Error en base de datos');
    
    // Mostrar alerta al usuario
    Alert.alert(
      'Error de Base de Datos',
      'No se pudo validar la estructura de la base de datos. La aplicación puede no funcionar correctamente.',
      [
        { text: 'Continuar', onPress: () => {} },
        { text: 'Reintentar', onPress: () => validateAndCreateTables() }
      ]
    );
  }
};

  // Función para obtener el perfil del usuario desde alwaysData
  const fetchUserProfile = async (firebaseUid: string) => {
    try {
      const response = await fetch(`${API_URL}users.php?uid=${firebaseUid}`);
      const data = await response.json();
      
      if (data.success) {
        setUserProfile(data.user);
      } else {
        console.error('Perfil no encontrado en alwaysData');
      }
    } catch (error) {
      console.error('Error al obtener perfil:', error);
    }
  };

  // Función para crear usuario en alwaysData
  const createUserInAlwaysData = async (profileData: UserProfile) => {
    try {
      const response = await fetch(`${API_URL}users.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al crear usuario en alwaysData');
      }
      
      return data;
    } catch (error) {
      console.error('Error en alwaysData:', error);
      throw error;
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const validateInputs = (): boolean => {
    const { email, password, nombre, apellido, edad } = formData;
    
    if (!email || !password) {
      setError('Email y contraseña son requeridos');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un email válido');
      return false;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    if (isSignUp) {
      if (!nombre || !apellido) {
        setError('Nombre y apellido son requeridos');
        return false;
      }
      
      if (edad && isNaN(Number(edad))) {
        setError('La edad debe ser un número');
        return false;
      }
    }
    
    return true;
  };

  const handleSignUp = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      const firebaseUser = userCredential.user;
      
      // 2. Crear perfil en alwaysData
      const profileData: UserProfile = {
        firebase_uid: firebaseUser.uid,
        email: formData.email,
        nombre: formData.nombre,
        apellido: formData.apellido,
        usuario: formData.usuario || formData.email.split('@')[0],
        edad: formData.edad ? parseInt(formData.edad) : undefined,
        direccion: formData.direccion || undefined
      };
      
      await createUserInAlwaysData(profileData);
      
      // 3. Actualizar estado local
      setUserProfile(profileData);
      
      Alert.alert('Éxito', 'Registro completado');
      resetForm();
    } catch (error) {
      handleAuthError(error, 'registro');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
    } catch (error) {
      handleAuthError(error, 'inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      Alert.alert('Éxito', 'Sesión cerrada');
    } catch (error) {
      handleAuthError(error, 'cierre de sesión');
    }
  };

  const handleAuthError = (error: unknown, action: string) => {
    const defaultMsg = `Error en ${action}`;
    
    if (error instanceof FirebaseError) {
      const messages = {
        'auth/email-already-in-use': 'El correo ya está registrado',
        'auth/invalid-email': 'Correo electrónico no válido',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde'
      };
      
      setError(messages[error.code] || error.message);
    } else {
      setError(defaultMsg);
    }
    
    Alert.alert('Error', error instanceof Error ? error.message : defaultMsg);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      usuario: '',
      edad: '',
      direccion: ''
    });
  };

  if (loading) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color="#6a1b9a" />
        <LoadingText>{databaseStatus}</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Container>
        {user ? (
          <AuthenticatedView>
            <WelcomeText>Bienvenido, {userProfile?.nombre || user.email}</WelcomeText>
            
            <AuthButton onPress={handleSignOut}>
              <ButtonText>Cerrar sesión</ButtonText>
            </AuthButton>
            
            {/* Solo visible para los admins */}
            {ADMIN_EMAILS.includes(user.email) && (
              <>
                <Link href="/(proyectos)/agregar-producto" asChild>
                  <AuthButton style={{ backgroundColor: '#4CAF50' }}>
                    <ButtonText>Agregar Productos</ButtonText>
                  </AuthButton>
                </Link>
                
                <Link href="/home" asChild>
                  <AuthButton style={{ backgroundColor: '#2196F3' }}>
                    <ButtonText>Ir al Panel Admin</ButtonText>
                  </AuthButton>
                </Link>
              </>
            )}
            
            <Link href="/home" asChild>
              <NavLink>Ir al inicio</NavLink>
            </Link>
          </AuthenticatedView>
        ) : (
          <AuthView>
            <Title>{isSignUp ? 'Registro' : 'Inicio de sesión'}</Title>
            <AuthIcon name="lock" size={50} />
            
            {error ? <ErrorText>{error}</ErrorText> : null}
            
            {isSignUp && (
              <>
                <StyledInput
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChangeText={(text) => handleChange('nombre', text)}
                />
                <StyledInput
                  placeholder="Apellido"
                  value={formData.apellido}
                  onChangeText={(text) => handleChange('apellido', text)}
                />
                <StyledInput
                  placeholder="Nombre de usuario"
                  value={formData.usuario}
                  onChangeText={(text) => handleChange('usuario', text)}
                  autoCapitalize="none"
                />
                <StyledInput
                  placeholder="Edad"
                  value={formData.edad}
                  onChangeText={(text) => handleChange('edad', text)}
                  keyboardType="numeric"
                />
                <StyledInput
                  placeholder="Dirección"
                  value={formData.direccion}
                  onChangeText={(text) => handleChange('direccion', text)}
                />
              </>
            )}
            
            <StyledInput
              placeholder="Correo electrónico"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <StyledInput
              placeholder="Contraseña"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              secureTextEntry
              autoCapitalize="none"
            />
            
            <AuthButton onPress={isSignUp ? handleSignUp : handleSignIn}>
              <ButtonText>{isSignUp ? 'Registrarse' : 'Iniciar sesión'}</ButtonText>
            </AuthButton>
            
            <ToggleAuthButton onPress={() => setIsSignUp(!isSignUp)}>
              <ToggleAuthText>
                {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </ToggleAuthText>
            </ToggleAuthButton>
          </AuthView>
        )}
      </Container>
    </ScrollView>
  );
}

// Styled Components (mantenidos igual)
const Container = styled.View`
  flex: 1;
  justify-content: center;
  padding: 20px;
  background-color: #f5f5f5;
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  gap: 20px;
`;

const LoadingText = styled.Text`
  font-size: 16px;
  color: #333;
`;

const AuthView = styled.View`
  width: 100%;
  max-width: 400px;
  align-self: center;
  gap: 15px;
`;

const AuthenticatedView = styled.View`
  width: 100%;
  max-width: 400px;
  align-self: center;
  align-items: center;
  gap: 20px;
`;

const Title = styled.Text`
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
  color: #333;
`;

const WelcomeText = styled.Text`
  font-size: 20px;
  text-align: center;
  color: #333;
`;

const AuthIcon = styled(AntDesign)`
  align-self: center;
  margin-bottom: 10px;
  color:rgb(27, 82, 154);
`;

const StyledInput = styled.TextInput`
  height: 50px;
  border-width: 1px;
  border-color: #ddd;
  border-radius: 8px;
  padding: 15px;
  background-color: white;
  font-size: 16px;
`;

const AuthButton = styled.TouchableOpacity`
  background-color: #6a1b9a;
  padding: 15px;
  border-radius: 8px;
  align-items: center;
  margin-top: 10px;
`;

const ButtonText = styled.Text`
  color: white;
  font-weight: bold;
  font-size: 16px;
`;

const ToggleAuthButton = styled.TouchableOpacity`
  margin-top: 15px;
  align-items: center;
`;

const ToggleAuthText = styled.Text`
  color: #6a1b9a;
  font-weight: bold;
`;

const NavLink = styled.Text`
  color: #6a1b9a;
  font-weight: bold;
  margin-top: 10px;
  text-align: center;
`;

const ErrorText = styled.Text`
  color:rgb(255, 30, 0);
  text-align: center;
  margin-bottom: 10px;
  font-size: 16px;
`;
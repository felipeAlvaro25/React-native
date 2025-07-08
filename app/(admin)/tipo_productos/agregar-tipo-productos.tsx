import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Text, TextInput, View } from 'react-native';

const API_URL = 'https://felipe25.alwaysdata.net/api/tipo-producto.php';

export default function CrearTipoProducto() {
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState('');
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  useEffect(() => {
    const cargarCategorias = async () => {
      setLoadingCategorias(true);
      try {
        const res = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
          setCategorias(data.categorias);
        } else {
          Alert.alert('Error', data.message || 'No se pudieron cargar las categorías');
        }
      } catch (error) {
        console.error('Error al cargar categorías:', error);
        Alert.alert('Error', 'Fallo la conexión con el servidor');
      } finally {
        setLoadingCategorias(false);
      }
    };
    
    cargarCategorias();
  }, []);

  const guardarTipo = async () => {
    if (!categoriaId || tipo.trim() === '') {
      Alert.alert('Campos requeridos', 'Seleccione una categoría y escriba un tipo');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoria_id: parseInt(categoriaId),
          tipo: tipo.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Alert.alert('Éxito', 'Tipo guardado correctamente', [
          {
            text: 'OK',
            onPress: () => {
              setTipo('');
              setCategoriaId('');
            }
          }
        ]);
      } else {
        Alert.alert('Error', data.message || 'No se pudo guardar el tipo');
      }
    } catch (error) {
      console.error('Error al guardar tipo:', error);
      Alert.alert('Error', 'Hubo un problema al guardar');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategorias) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 10 }}>Cargando categorías...</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, marginBottom: 20, fontWeight: 'bold' }}>
        Agregar Tipo de Producto
      </Text>

      <Text style={{ marginBottom: 8, fontSize: 16 }}>Selecciona una Categoría:</Text>
      <View style={{ 
        borderWidth: 1, 
        borderColor: '#ccc', 
        borderRadius: 5, 
        marginBottom: 20,
        backgroundColor: '#f0f0f0' 
      }}>
        <Picker
          selectedValue={categoriaId}
          onValueChange={setCategoriaId}
          style={{ height: 50 }}
        >
          <Picker.Item label="Seleccione una categoría" value="" />
          {categorias.map(cat => (
            <Picker.Item key={cat.id} label={cat.nombre} value={cat.id.toString()} />
          ))}
        </Picker>
      </View>

      <Text style={{ marginBottom: 8, fontSize: 16 }}>Nombre del Tipo:</Text>
      <TextInput
        placeholder="Ej. Deportivo, Elegante..."
        value={tipo}
        onChangeText={setTipo}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 5,
          padding: 12,
          marginBottom: 20,
          fontSize: 16,
          backgroundColor: '#fff'
        }}
      />

      {loading ? (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={{ marginTop: 10 }}>Guardando...</Text>
        </View>
      ) : (
        <Button title="Guardar Tipo" onPress={guardarTipo} color="#10b981" />
      )}
    </View>
  );
}
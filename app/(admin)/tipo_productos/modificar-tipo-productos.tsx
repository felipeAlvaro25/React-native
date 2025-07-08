import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const API_URL = 'https://felipe25.alwaysdata.net/api/tipo-producto.php';

export default function App() {
  const [categories, setCategories] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [selectedFilterCategoryId, setSelectedFilterCategoryId] = useState('');
  const [updateId, setUpdateId] = useState('');
  const [updateTipo, setUpdateTipo] = useState('');
  const [updateCategoriaId, setUpdateCategoriaId] = useState('');
  const [message, setMessage] = useState('');
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const fetchInitialData = async () => {
    setLoadingInitialData(true);
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const jsonResponse = await response.json();
      if (jsonResponse.success) {
        setCategories(jsonResponse.categorias || []);
        setAllTypes(jsonResponse.tipos_producto || []);
      } else {
        setMessage(`Error al cargar datos: ${jsonResponse.message}`);
      }
    } catch (error) {
      setMessage(`Error de red: ${error.message}`);
    } finally {
      setLoadingInitialData(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const filteredTypes = allTypes.filter(type =>
    selectedFilterCategoryId ? type.categoria.toString() === selectedFilterCategoryId : true
  );

  const handleFilterCategoryChange = (categoryId) => {
    setSelectedFilterCategoryId(categoryId);
    setUpdateId('');
    setUpdateTipo('');
    setUpdateCategoriaId('');
  };

  const handleSelectTipoToUpdate = (selectedTipoId) => {
    setUpdateId(selectedTipoId);
    if (selectedTipoId) {
      const selectedType = allTypes.find(type => type.id.toString() === selectedTipoId);
      if (selectedType) {
        setUpdateTipo(selectedType.tipo);
        setUpdateCategoriaId(selectedType.categoria.toString());
      }
    } else {
      setUpdateTipo('');
      setUpdateCategoriaId('');
    }
  };

  const handleUpdateTipo = async () => {
    if (!updateId || !updateTipo) {
      setMessage('Selecciona un tipo e ingresa el nuevo nombre.');
      return;
    }

    setLoadingUpdate(true);
    setMessage('Actualizando tipo...');
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(updateId),
          tipo: updateTipo,
          categoria_id: parseInt(updateCategoriaId),
        }),
      });
      const jsonResponse = await response.json();

      if (jsonResponse.success) {
        setMessage(`Éxito: ${jsonResponse.message}`);
        fetchInitialData();
        setUpdateId('');
        setUpdateTipo('');
        setUpdateCategoriaId('');
        setSelectedFilterCategoryId('');
      } else {
        setMessage(`Error: ${jsonResponse.message}`);
      }
    } catch (error) {
      setMessage(`Error de red: ${error.message}`);
    } finally {
      setLoadingUpdate(false);
    }
  };

  if (loadingInitialData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Gestión de Tipos de Producto</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modificar Tipo Existente</Text>

        <Text style={styles.label}>Filtrar por Categoría:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedFilterCategoryId}
            onValueChange={handleFilterCategoryChange}
            style={styles.picker}
          >
            <Picker.Item label="Todas las categorías" value="" />
            {categories.map((cat) => (
              <Picker.Item key={cat.id} label={cat.nombre} value={cat.id.toString()} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Selecciona Tipo a Modificar:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={updateId}
            onValueChange={handleSelectTipoToUpdate}
            style={styles.picker}
            enabled={filteredTypes.length > 0}
          >
            <Picker.Item label={filteredTypes.length > 0 ? "Selecciona un tipo..." : "No hay tipos"} value="" />
            {filteredTypes.map((type) => (
              <Picker.Item key={type.id} label={`${type.tipo} (ID: ${type.id})`} value={type.id.toString()} />
            ))}
          </Picker>
        </View>

        {/* Texto explicativo si el TextInput está deshabilitado */}
        {!updateId && (
          <Text style={{ color: '#888', marginBottom: 10 }}>
            Selecciona un tipo para habilitar el campo de edición
          </Text>
        )}

        <Text style={styles.label}>Nuevo Nombre del Tipo:</Text>
        <TextInput
          style={styles.input}
          placeholder="actualiza"
          value={updateTipo}
          onChangeText={setUpdateTipo}
          editable={!!updateId} 
        />

        {loadingUpdate ? (
          <ActivityIndicator size="small" color="#2196F3" style={{ marginTop: 10 }} />
        ) : (
          <Button
            title="Modificar Tipo"
            onPress={handleUpdateTipo}
            color="#2196F3"
            disabled={!updateId}
          />
        )}
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#555',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 15,
    color: '#555',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff',
    height: 50,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    color: '#D32F2F',
    fontWeight: '500',
  },
});

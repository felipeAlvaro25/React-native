import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// (Opcional pero recomendado) Define la estructura del proveedor
interface Proveedor {
    id: number;
    nombre: string;
    ruc: string;
    categoria: string;
}

const ModificarProveedor: React.FC = () => {
    // Obtiene el 'id' de la URL (ej. /proveedores/modificar/5)
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Estados para los campos del formulario y para el mensaje de error
    const [nombre, setNombre] = useState('');
    const [ruc, setRuc] = useState('');
    const [categoria, setCategoria] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Hook para cargar los datos del proveedor al iniciar el componente
    useEffect(() => {
        if (!id) return;

        const fetchProveedor = async () => {
            try {
                // ⚠️ Reemplaza esta URL con la de tu API
                const response = await fetch(`http://localhost/tu-proyecto/api/obtener-proveedor.php?id=${id}`);
                const data = await response.json();

                if (data.success) {
                    // Carga los datos en el estado del formulario
                    setNombre(data.proveedor.nombre);
                    setRuc(data.proveedor.ruc);
                    setCategoria(data.proveedor.categoria);
                } else {
                    // Muestra el error si la API falla
                    setError(data.message);
                }
            } catch (err) {
                setError('Error de conexión. No se pudo comunicar con el servidor.');
            }
        };

        fetchProveedor();
    }, [id]); // Se ejecuta cada vez que el 'id' cambie

    // Función para manejar el envío del formulario de actualización
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        // Aquí va tu lógica para enviar los datos actualizados
        // al script 'modificar-proveedor.php' que ya tienes.
        // Ejemplo: const formData = new FormData(); ...
    };

    // Muestra el mensaje de error si existe
    if (error) {
        return (
            <div>
                <p>{error}</p>
                <button onClick={() => navigate('/proveedores')}>Volver</button>
            </div>
        );
    }

    // Muestra el formulario con los datos cargados
    return (
        <form onSubmit={handleUpdate}>
            <label>Nombre:</label>
            <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
            />

            <label>RUC:</label>
            <input
                type="text"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
            />

            <label>Categoría:</label>
            <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
            />
            
            <button type="submit">Actualizar Proveedor</button>
        </form>
    );
};

export default ModificarProveedor;
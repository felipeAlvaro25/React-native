<?php
// Configurar manejo de errores
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Headers CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Capturar cualquier output no deseado
ob_start();

try {
    require_once 'config.php';
} catch (Exception $e) {
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'message' => 'Error en configuración: ' . $e->getMessage()
    ]);
    exit();
}

// Verificar conexión
if ($conn->connect_error) {
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos: ' . $conn->connect_error
    ]);
    exit();
}

// Limpiar buffer
ob_end_clean();

// Manejar diferentes acciones
$accion = $_POST['accion'] ?? $_GET['accion'] ?? '';

switch ($accion) {
    case 'obtener_categorias':
        obtenerCategorias($conn);
        break;
    case 'obtener_proveedores_por_categoria':
        obtenerProveedoresPorCategoria($conn);
        break;
    case 'obtener_proveedor':
        obtenerProveedor($conn);
        break;
    case 'actualizar_proveedor':
        actualizarProveedor($conn);
        break;
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Acción no especificada o no válida'
        ]);
        break;
}

$conn->close();

// Función para obtener todas las categorías
function obtenerCategorias($conn) {
    try {
        $sql = "SELECT id, nombre FROM categorias ORDER BY nombre ASC";
        $result = $conn->query($sql);

        if (!$result) {
            throw new Exception('Error al consultar categorías: ' . $conn->error);
        }

        $categorias = [];
        while ($row = $result->fetch_assoc()) {
            $categorias[] = $row;
        }

        echo json_encode([
            'success' => true,
            'categorias' => $categorias
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// Función para obtener proveedores por categoría
function obtenerProveedoresPorCategoria($conn) {
    try {
        if (!isset($_GET['categoria_id']) || empty($_GET['categoria_id'])) {
            throw new Exception('ID de categoría no especificado');
        }

        $categoria_id = $conn->real_escape_string($_GET['categoria_id']);
        
        // Validar que el ID sea un número
        if (!is_numeric($categoria_id)) {
            throw new Exception('ID de categoría no válido');
        }

        // Verificar que la categoría existe
        $checkCategoria = "SELECT id, nombre FROM categorias WHERE id = '$categoria_id'";
        $resultCategoria = $conn->query($checkCategoria);
        
        if (!$resultCategoria || $resultCategoria->num_rows === 0) {
            throw new Exception('La categoría no existe');
        }

        // Obtener proveedores de la categoría
        $sql = "SELECT p.id, p.nombre, p.ruc, p.logo, p.categoria, c.nombre as categoria_nombre 
                FROM proveedores p 
                LEFT JOIN categorias c ON p.categoria = c.id 
                WHERE p.categoria = '$categoria_id' 
                ORDER BY p.nombre ASC";
        
        $result = $conn->query($sql);

        if (!$result) {
            throw new Exception('Error al consultar proveedores: ' . $conn->error);
        }

        $proveedores = [];
        while ($row = $result->fetch_assoc()) {
            // Convertir ruta de archivo a URL completa si es necesario
            if (!empty($row['logo'])) {
                $baseUrl = getBaseUrl();
                // Verificar si ya es una URL completa
                if (strpos($row['logo'], 'http') !== 0) {
                    $row['logo'] = $baseUrl . '/' . $row['logo'];
                }
            }
            $proveedores[] = $row;
        }

        echo json_encode([
            'success' => true,
            'proveedores' => $proveedores,
            'categoria' => $resultCategoria->fetch_assoc()
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// Función para obtener datos de un proveedor específico
function obtenerProveedor($conn) {
    try {
        if (!isset($_GET['id']) || empty($_GET['id'])) {
            throw new Exception('ID de proveedor no especificado');
        }

        $id = $conn->real_escape_string($_GET['id']);
        
        // Validar que el ID sea un número
        if (!is_numeric($id)) {
            throw new Exception('ID de proveedor no válido');
        }
        
        $sql = "SELECT p.id, p.nombre, p.ruc, p.logo, p.categoria, c.nombre as categoria_nombre 
                FROM proveedores p 
                LEFT JOIN categorias c ON p.categoria = c.id 
                WHERE p.id = '$id'";
        
        $result = $conn->query($sql);

        if (!$result) {
            throw new Exception('Error al consultar proveedor: ' . $conn->error);
        }

        if ($result->num_rows === 0) {
            throw new Exception('Proveedor no encontrado');
        }

        $proveedor = $result->fetch_assoc();
        
        // Convertir ruta de archivo a URL completa si es necesario
        if (!empty($proveedor['logo'])) {
            $baseUrl = getBaseUrl();
            // Verificar si ya es una URL completa
            if (strpos($proveedor['logo'], 'http') !== 0) {
                $proveedor['logo'] = $baseUrl . '/' . $proveedor['logo'];
            }
        }

        echo json_encode([
            'success' => true,
            'proveedor' => $proveedor
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// Función para actualizar un proveedor
// Función para actualizar un proveedor
function actualizarProveedor($conn) {
    try {
        // Validar campos requeridos
        if (empty($_POST['id']) || empty($_POST['nombre']) || empty($_POST['ruc']) || empty($_POST['categoria'])) {
            throw new Exception('Todos los campos son obligatorios');
        }

        $id = $conn->real_escape_string($_POST['id']);
        $nombre = $conn->real_escape_string($_POST['nombre']);
        $ruc = $conn->real_escape_string($_POST['ruc']);
        $categoria = $conn->real_escape_string($_POST['categoria']);
        $fecha_actual = date('Y-m-d H:i:s');
        $mantener_imagen = isset($_POST['mantener_imagen']) && $_POST['mantener_imagen'] == '1';

        // Validar que el ID sea un número
        if (!is_numeric($id)) {
            throw new Exception('ID de proveedor no válido');
        }

        // Validar RUC (mínimo 4 dígitos)
        if (strlen($ruc) < 4 || !ctype_digit($ruc)) {
            throw new Exception('El RUC debe tener al menos 4 dígitos numéricos');
        }

        // Validar que la categoría existe
        $checkCategoria = "SELECT id FROM categorias WHERE id = '$categoria'";
        $resultCategoria = $conn->query($checkCategoria);
        
        if (!$resultCategoria || $resultCategoria->num_rows === 0) {
            throw new Exception('La categoría seleccionada no existe');
        }

        // Verificar si el RUC ya existe (excluyendo el actual)
        $checkRuc = "SELECT id FROM proveedores WHERE ruc = '$ruc' AND id != '$id'";
        $result = $conn->query($checkRuc);
        
        if (!$result) {
            throw new Exception('Error al verificar RUC: ' . $conn->error);
        }
        
        if ($result->num_rows > 0) {
            throw new Exception('Ya existe otro proveedor con este RUC');
        }

        // Verificar que el proveedor existe
        $checkProveedor = "SELECT id, logo FROM proveedores WHERE id = '$id'";
        $resultProveedor = $conn->query($checkProveedor);
        
        if (!$resultProveedor || $resultProveedor->num_rows === 0) {
            throw new Exception('El proveedor no existe');
        }

        $proveedorActual = $resultProveedor->fetch_assoc();
        $logoPath = $proveedorActual['logo']; // Mantener la imagen actual por defecto

        // Procesar imagen si se envió una nueva (y no se marcó mantener imagen)
        if (!$mantener_imagen) {
            if (!empty($_POST['logo'])) {
                // Subir nueva imagen
                $logoPath = guardarImagen($_POST['logo']);
                if (!$logoPath) {
                    throw new Exception('Error al procesar la imagen');
                }
                
                // Eliminar la imagen anterior si existe
                if (!empty($proveedorActual['logo'])) {
                    eliminarImagenAnterior($conn, $id);
                }
            } else {
                // Si no se envía imagen y no se marca mantener, eliminar la existente
                $logoPath = null;
                if (!empty($proveedorActual['logo'])) {
                    eliminarImagenAnterior($conn, $id);
                }
            }
        }

        // Construir consulta SQL de actualización
        $sql = "UPDATE proveedores SET 
                nombre = '$nombre',
                ruc = '$ruc',
                categoria = '$categoria',
                updated_at = '$fecha_actual'";
        
        // Manejar el campo de imagen
        if ($logoPath !== null) {
            $sql .= ", logo = '$logoPath'";
        } else {
            $sql .= ", logo = NULL";
        }
        
        $sql .= " WHERE id = '$id'";

        if ($conn->query($sql)) {
            echo json_encode([
                'success' => true,
                'message' => 'Proveedor actualizado correctamente',
                'logo' => $logoPath ? getBaseUrl() . '/' . $logoPath : null
            ]);
        } else {
            // Si hay error, eliminar la imagen nueva si se subió
            if (isset($logoPath) && $logoPath !== $proveedorActual['logo'] && file_exists(__DIR__ . '/' . $logoPath)) {
                unlink(__DIR__ . '/' . $logoPath);
            }
            
            throw new Exception('Error al actualizar proveedor: ' . $conn->error);
        }
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// Función para eliminar la imagen anterior del proveedor (mejorada)
function eliminarImagenAnterior($conn, $proveedorId) {
    try {
        $queryOldImage = "SELECT logo FROM proveedores WHERE id = '$proveedorId'";
        $resultOldImage = $conn->query($queryOldImage);
        
        if ($resultOldImage && $row = $resultOldImage->fetch_assoc()) {
            if (!empty($row['logo'])) {
                $fullPath = __DIR__ . '/' . $row['logo'];
                if (file_exists($fullPath) && is_file($fullPath)) {
                    // Verificar que el archivo no está siendo usado
                    if (is_writable($fullPath)) {
                        unlink($fullPath);
                        // Eliminar directorios vacíos si es necesario
                        $dir = dirname($fullPath);
                        if (count(scandir($dir)) == 2) { // Solo . y ..
                            rmdir($dir);
                        }
                    }
                }
            }
        }
    } catch (Exception $e) {
        error_log('Error al eliminar imagen anterior: ' . $e->getMessage());
    }
}

// Función para guardar imagen (base64 a archivo)
function guardarImagen($base64Image) {
    try {
        // Eliminar el prefijo si existe (ej: data:image/jpeg;base64,)
        if (strpos($base64Image, ',') !== false) {
            $base64Image = explode(',', $base64Image)[1];
        }
        
        // Decodificar la imagen
        $imageData = base64_decode($base64Image);
        
        if ($imageData === false) {
            error_log('Error: No se pudo decodificar la imagen base64');
            return false;
        }
        
        // Validar que sea una imagen válida
        $tempFile = tmpfile();
        $tempPath = stream_get_meta_data($tempFile)['uri'];
        file_put_contents($tempPath, $imageData);
        
        $imageInfo = getimagesize($tempPath);
        fclose($tempFile);
        
        if ($imageInfo === false) {
            error_log('Error: Los datos no corresponden a una imagen válida');
            return false;
        }
        
        // Validar dimensiones de la imagen
        if ($imageInfo[0] > 2048 || $imageInfo[1] > 2048) {
            error_log('Error: La imagen es demasiado grande');
            return false;
        }
        
        // Determinar extensión basada en el tipo MIME
        $extension = '';
        switch ($imageInfo['mime']) {
            case 'image/jpeg':
                $extension = '.jpg';
                break;
            case 'image/png':
                $extension = '.png';
                break;
            case 'image/gif':
                $extension = '.gif';
                break;
            default:
                error_log('Error: Tipo de imagen no soportado: ' . $imageInfo['mime']);
                return false;
        }
        
        // Generar nombre único para el archivo
        $nombreArchivo = 'proveedor_' . uniqid() . '_' . date('YmdHis') . $extension;
        $uploadDir = __DIR__ . '/uploads/proveedores/';
        
        // Crear directorio si no existe
        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                error_log('Error: No se pudo crear el directorio: ' . $uploadDir);
                return false;
            }
        }
        
        $rutaCompleta = $uploadDir . $nombreArchivo;
        $rutaRelativa = 'uploads/proveedores/' . $nombreArchivo;
        
        // Guardar el archivo
        if (file_put_contents($rutaCompleta, $imageData) === false) {
            error_log('Error: No se pudo guardar el archivo en: ' . $rutaCompleta);
            return false;
        }
        
        // Establecer permisos del archivo
        chmod($rutaCompleta, 0644);
        
        return $rutaRelativa;
        
    } catch (Exception $e) {
        error_log('Excepción al guardar imagen: ' . $e->getMessage());
        return false;
    }
}

// Función para obtener la URL base
function getBaseUrl() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'];
    $script = $_SERVER['SCRIPT_NAME'];
    $path = dirname($script);
    
    // Limpiar la ruta
    $path = str_replace('\\', '/', $path);
    $path = rtrim($path, '/');
    
    return $protocol . $host . $path;
}
?>
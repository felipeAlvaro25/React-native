<?php
// Configurar manejo de errores para evitar HTML en respuesta JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Headers CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

// Crear directorio de uploads si no existe
<<<<<<< HEAD
$uploadDir = _DIR_ . '/uploads/proveedores/';
=======
$uploadDir = __DIR__ . '/uploads/proveedores/';
>>>>>>> d3704d23ae51e77c2ae090deea59bc5db29e81b4
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        ob_end_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear directorio de uploads'
        ]);
        exit();
    }
}

// Limpiar cualquier output previo
ob_end_clean();

// Manejar diferentes acciones
$accion = $_POST['accion'] ?? $_GET['accion'] ?? '';

try {
    switch ($accion) {
        case 'guardar_proveedor':
            guardarProveedor($conn);
            break;
        case 'obtener_proveedores':
            obtenerProveedores($conn);
            break;
        case 'obtener_categorias':
            obtenerCategorias($conn);
            break;
        default:
            // Si no hay acción específica, verificar si es una consulta GET para categorías
            if (isset($_GET['categorias'])) {
                obtenerCategorias($conn);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Acción no especificada'
                ]);
            }
            break;
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor: ' . $e->getMessage()
    ]);
} finally {
    $conn->close();
}

function guardarProveedor($conn) {
    try {
        // Validar campos requeridos
        if (empty($_POST['nombre']) || empty($_POST['ruc']) || empty($_POST['categoria'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Todos los campos son obligatorios'
            ]);
            return;
        }

        // Validar RUC (mínimo 4 dígitos)
        if (strlen($_POST['ruc']) < 4 || !ctype_digit($_POST['ruc'])) {
            echo json_encode([
                'success' => false,
                'message' => 'El RUC debe tener al menos 4 dígitos numéricos'
            ]);
            return;
        }

        // Verificar si el RUC ya existe
        $ruc = $conn->real_escape_string($_POST['ruc']);
        $checkRuc = "SELECT id FROM proveedores WHERE ruc = '$ruc'";
        $result = $conn->query($checkRuc);
        
        if ($result && $result->num_rows > 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Ya existe un proveedor con este RUC'
            ]);
            return;
        }

        // Procesar imagen
        $logoPath = null;
        if (!empty($_POST['logo'])) {
            $logoPath = guardarImagen($_POST['logo']);
            if (!$logoPath) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Error al procesar la imagen'
                ]);
                return;
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'El logo es obligatorio'
            ]);
            return;
        }

        // Preparar datos para inserción
        $nombre = $conn->real_escape_string($_POST['nombre']);
        $categoria = $conn->real_escape_string($_POST['categoria']);
        $fecha_actual = date('Y-m-d H:i:s');

        // Insertar en la base de datos
        $sql = "INSERT INTO proveedores (nombre, ruc, logo, categoria, created_at, updated_at) 
                VALUES ('$nombre', '$ruc', '$logoPath', '$categoria', '$fecha_actual', '$fecha_actual')";

        if ($conn->query($sql) === TRUE) {
            echo json_encode([
                'success' => true,
                'message' => 'Proveedor registrado correctamente',
                'id' => $conn->insert_id
            ]);
        } else {
            // Si hay error, eliminar la imagen guardada
<<<<<<< HEAD
            if ($logoPath && file_exists(_DIR_ . '/' . $logoPath)) {
                unlink(_DIR_ . '/' . $logoPath);
=======
            if ($logoPath && file_exists(__DIR__ . '/' . $logoPath)) {
                unlink(__DIR__ . '/' . $logoPath);
>>>>>>> d3704d23ae51e77c2ae090deea59bc5db29e81b4
            }
            
            echo json_encode([
                'success' => false,
                'message' => 'Error al registrar proveedor en la base de datos'
            ]);
        }
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error interno del servidor: ' . $e->getMessage()
        ]);
    }
}

function obtenerProveedores($conn) {
    try {
        $sql = "SELECT p.id, p.nombre, p.ruc, p.logo, p.categoria, c.nombre as categoria_nombre 
                FROM proveedores p 
                LEFT JOIN categorias c ON p.categoria = c.id 
                ORDER BY p.nombre ASC";
        
        $result = $conn->query($sql);

        if (!$result) {
            echo json_encode([
                'success' => false,
                'message' => 'Error en la consulta de proveedores'
            ]);
            return;
        }

        $proveedores = [];
        while($row = $result->fetch_assoc()) {
            // Convertir ruta de archivo a URL completa
            if (!empty($row['logo'])) {
                $baseUrl = getBaseUrl();
                $row['logo'] = $baseUrl . '/' . $row['logo'];
            }
            $proveedores[] = $row;
        }

        echo json_encode([
            'success' => true,
            'proveedores' => $proveedores
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener proveedores: ' . $e->getMessage()
        ]);
    }
}

function obtenerCategorias($conn) {
    try {
        $sql = "SELECT id, nombre FROM categorias ORDER BY nombre ASC";
        $result = $conn->query($sql);

        if (!$result) {
            echo json_encode([
                'success' => false,
                'message' => 'Error en la consulta de categorías'
            ]);
            return;
        }

        $categorias = [];
        while($row = $result->fetch_assoc()) {
            $categorias[] = $row;
        }

        echo json_encode([
            'success' => true,
            'categorias' => $categorias
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener categorías: ' . $e->getMessage()
        ]);
    }
}

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
            case 'image/webp':
                $extension = '.webp';
                break;
            default:
                error_log('Error: Tipo de imagen no soportado: ' . $imageInfo['mime']);
                return false;
        }
        
        // Generar nombre único para el archivo
        $nombreArchivo = 'proveedor_' . uniqid() . '_' . date('YmdHis') . $extension;
<<<<<<< HEAD
        $uploadDir = _DIR_ . '/uploads/proveedores/';
=======
        $uploadDir = __DIR__ . '/uploads/proveedores/';
>>>>>>> d3704d23ae51e77c2ae090deea59bc5db29e81b4
        $rutaCompleta = $uploadDir . $nombreArchivo;
        $rutaRelativa = 'uploads/proveedores/' . $nombreArchivo;
        
        // Guardar el archivo
        if (file_put_contents($rutaCompleta, $imageData) === false) {
            error_log('Error: No se pudo guardar el archivo en: ' . $rutaCompleta);
            return false;
        }
        
        // Verificar que el archivo se guardó correctamente
        if (!file_exists($rutaCompleta)) {
            error_log('Error: El archivo no existe después de guardarlo: ' . $rutaCompleta);
            return false;
        }
        
        // Establecer permisos del archivo
        chmod($rutaCompleta, 0644);
        
        error_log('Imagen guardada exitosamente: ' . $rutaRelativa);
        return $rutaRelativa;
        
    } catch (Exception $e) {
        error_log('Excepción al guardar imagen: ' . $e->getMessage());
        return false;
    }
}

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

// Función para limpiar archivos huérfanos (opcional, llamar manualmente)
function limpiarImagenesHuerfanas($conn) {
<<<<<<< HEAD
    $uploadDir = _DIR_ . '/uploads/proveedores/';
=======
    $uploadDir = __DIR__ . '/uploads/proveedores/';
>>>>>>> d3704d23ae51e77c2ae090deea59bc5db29e81b4
    
    if (!is_dir($uploadDir)) {
        return;
    }
    
    // Obtener todas las imágenes referenciadas en la base de datos
    $sql = "SELECT logo FROM proveedores WHERE logo IS NOT NULL AND logo != ''";
    $result = $conn->query($sql);
    
    $imagenesEnUso = [];
    while ($row = $result->fetch_assoc()) {
        $imagenesEnUso[] = basename($row['logo']);
    }
    
    // Escanear directorio y eliminar archivos no referenciados
    $archivos = scandir($uploadDir);
    foreach ($archivos as $archivo) {
        if ($archivo != '.' && $archivo != '..' && is_file($uploadDir . $archivo)) {
            if (!in_array($archivo, $imagenesEnUso)) {
                unlink($uploadDir . $archivo);
                error_log('Imagen huérfana eliminada: ' . $archivo);
            }
        }
    }
}
?>
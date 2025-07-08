<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

// Verificar conexión
if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos: ' . $conn->connect_error
    ]);
    exit();
}

// Manejar diferentes acciones
$accion = $_POST['accion'] ?? '';

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
        echo json_encode([
            'success' => false,
            'message' => 'Acción no especificada'
        ]);
        break;
}

$conn->close();

function guardarProveedor($conn) {
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

    // Procesar imagen
    $logo = null;
    if (!empty($_POST['logo'])) {
        $logo = guardarImagen($_POST['logo']);
        if (!$logo) {
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
    $ruc = $conn->real_escape_string($_POST['ruc']);
    $categoria = $conn->real_escape_string($_POST['categoria']);
    $fecha_actual = date('Y-m-d H:i:s');

    // Insertar en la base de datos
    $sql = "INSERT INTO proveedores (nombre, ruc, logo, categoria, created_at, updated_at) 
            VALUES ('$nombre', '$ruc', '$logo', '$categoria', '$fecha_actual', '$fecha_actual')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            'success' => true,
            'message' => 'Proveedor registrado correctamente',
            'id' => $conn->insert_id
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error al registrar proveedor: ' . $conn->error
        ]);
    }
}

function obtenerProveedores($conn) {
    $sql = "SELECT id, nombre, ruc, logo, categoria FROM proveedores ORDER BY nombre ASC";
    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode([
            'success' => false,
            'message' => 'Error en la consulta: ' . $conn->error
        ]);
        return;
    }

    $proveedores = [];
    while($row = $result->fetch_assoc()) {
        // Convertir imagen binaria a base64 si es necesario
        if (!empty($row['logo']) && !filter_var($row['logo'], FILTER_VALIDATE_URL)) {
            $row['logo'] = 'data:image/jpeg;base64,' . base64_encode($row['logo']);
        }
        $proveedores[] = $row;
    }

    echo json_encode([
        'success' => true,
        'proveedores' => $proveedores
    ]);
}

function obtenerCategorias($conn) {
    $sql = "SELECT id, nombre FROM categorias ORDER BY nombre ASC";
    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode([
            'success' => false,
            'message' => 'Error en la consulta: ' . $conn->error
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
}

function guardarImagen($base64Image) {
    // Eliminar el prefijo si existe (ej: data:image/jpeg;base64,)
    if (strpos($base64Image, ',') !== false) {
        $base64Image = explode(',', $base64Image)[1];
    }
    
    // Decodificar la imagen
    $imageData = base64_decode($base64Image);
    
    // Validar que sea una imagen válida
    if (!@imagecreatefromstring($imageData)) {
        return false;
    }
    
    // Opción 1: Guardar como BLOB en la base de datos (recomendado para este caso)
    return $imageData;
    
    // Opción 2: Guardar en el sistema de archivos (descomentar si prefieres esta opción)
    /*
    $nombreArchivo = uniqid() . '.jpg';
    $ruta = 'uploads/' . $nombreArchivo;
    
    if (!file_put_contents($ruta, $imageData)) {
        return false;
    }
    
    return $ruta;
    */
}
?>
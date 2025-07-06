<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

// Función para validar tablas (la misma que tenías)
function validarTablas($conn) {
    $tablasRequeridas = ['usuarios', 'proveedores', 'productos', 'carrito', 'detalles_compra'];
    $tablasExistentes = [];
    $tablasFaltantes = [];
    
    $query = "SHOW TABLES";
    $result = mysqli_query($conn, $query);
    
    if ($result) {
        while ($row = mysqli_fetch_array($result)) {
            $tablasExistentes[] = $row[0];
        }
    }
    
    foreach ($tablasRequeridas as $tabla) {
        if (!in_array($tabla, $tablasExistentes)) {
            $tablasFaltantes[] = $tabla;
        }
    }
    
    return [
        'todasExisten' => empty($tablasFaltantes),
        'existentes' => $tablasExistentes,
        'faltantes' => $tablasFaltantes,
        'requeridas' => $tablasRequeridas
    ];
}

// Función para crear tablas (la misma que tenías)
function crearTablasFaltantes($conn) {
    $sql = "
    CREATE TABLE IF NOT EXISTS proveedores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        ruc VARCHAR(20) UNIQUE NOT NULL,
        logo VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firebase_uid VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        usuario VARCHAR(100),
        edad INT,
        direccion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL,
        categoria VARCHAR(50),
        imagenURL VARCHAR(255),
        color VARCHAR(50),
        talla VARCHAR(20),
        tipo VARCHAR(50),
        status ENUM('activo', 'inactivo', 'agotado') DEFAULT 'activo',
        comprados INT DEFAULT 0,
        marca INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (marca) REFERENCES proveedores(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS carrito (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_producto INT NOT NULL,
        canti_productos INT NOT NULL,
        id_usuario INT NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        itbms DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status ENUM('activo', 'procesando', 'completado', 'cancelado') DEFAULT 'activo',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS detalles_compra (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_carrito INT NOT NULL,
        id_producto INT NOT NULL,
        id_usuario INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_carrito) REFERENCES carrito(id) ON DELETE CASCADE,
        FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
    );
    ";

    if (mysqli_multi_query($conn, $sql)) {
        do {
            if ($resultado = mysqli_store_result($conn)) {
                mysqli_free_result($resultado);
            }
        } while (mysqli_next_result($conn));
        return true;
    } else {
        return false;
    }
}

// Función principal
function inicializarBaseDatos($conn) {
    $validacion = validarTablas($conn);
    
    $response = [
        'success' => false,
        'message' => '',
        'data' => $validacion
    ];
    
    if ($validacion['todasExisten']) {
        $response['success'] = true;
        $response['message'] = 'Todas las tablas requeridas existen';
    } else {
        if (crearTablasFaltantes($conn)) {
            $validacionFinal = validarTablas($conn);
            
            if ($validacionFinal['todasExisten']) {
                $response['success'] = true;
                $response['message'] = 'Tablas creadas exitosamente';
                $response['data'] = $validacionFinal;
            } else {
                $response['message'] = 'Error: No se pudieron crear todas las tablas';
            }
        } else {
            $response['message'] = 'Error al crear las tablas: ' . mysqli_error($conn);
        }
    }
    
    return $response;
}

// Ejecutar la validación
$resultado = inicializarBaseDatos($conn);
error_log("Respuesta a enviar: " . print_r($resultado, true));
echo json_encode($resultado);

mysqli_close($conn);
?>
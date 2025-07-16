import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

function App() {
  const [data, setData] = useState([]);
  const [patente, setPatente] = useState("");
  const [resultado, setResultado] = useState(null);
  const [scanning, setScanning] = useState(false);

  // ✅ Se elimina el estado de inicialización y se carga directamente
  useEffect(() => {
    fetch(
      "https://opensheet.elk.sh/1gZya2Vpk9lbFczvycPZYcamIGhh7WE5hAEZ6NLc0VlY/Hoja1"
    )
      .then((response) => response.json())
      .then((json) => setData(json))
      .catch(() => {
        setResultado({
          estado: "error",
          mensaje: "Error al cargar la planilla",
        });
      });
  }, []);

  const verificarPatente = (valor) => {
    const normalizado = valor.trim().toUpperCase();
    const encontrado = data.find((item) => item.Patente === normalizado);

    if (!encontrado) {
      setResultado({
        estado: "denegado",
        mensaje: "Patente no encontrada",
      });
    } else if (encontrado["Estado General"] === "Rojo") {
      setResultado({
        estado: "denegado",
        mensaje: "Acceso denegado",
      });
    } else {
      setResultado({
        estado: "autorizado",
        mensaje: `Autorizado: ${encontrado.Propietario}`,
      });
    }
  };

  const handleScan = () => {
    if (scanning) return;

    setScanning(true);
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: 250,
    });

    scanner.render(
      (decodedText) => {
        setPatente(decodedText);
        verificarPatente(decodedText);
        scanner.clear();
        setScanning(false);
      },
      (error) => {
        console.warn("QR error", error);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">
        Control de Acceso Estacionamiento
      </h1>
      <div className="flex gap-2 mb-4">
        <input
          value={patente}
          onChange={(e) => setPatente(e.target.value)}
          placeholder="Ingrese patente"
          className="p-2 border rounded w-80"
        />
        <button
          onClick={() => verificarPatente(patente)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Verificar
        </button>
      </div>
      <button
        onClick={handleScan}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4"
      >
        Escanear QR
      </button>
      <div id="reader" className="mb-4" />
      {resultado && (
        <div
          className={`p-6 rounded shadow-md text-center text-lg font-bold ${
            resultado.estado === "autorizado"
              ? "bg-green-100 text-green-800"
              : resultado.estado === "denegado"
              ? "bg-red-300 text-white"
              : "bg-gray-300 text-black"
          }`}
        >
          {resultado.mensaje}
        </div>
      )}
    </div>
  );
}

export default App;

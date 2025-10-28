import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Menu, X } from "lucide-react"; // icon library built into shadcn/lucide-react

// --- Fix Leaflet icon issue ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Helper to fly to a selected quake
function FlyToLocation({ coordinates }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates) map.flyTo(coordinates, 5, { duration: 1.5 });
  }, [coordinates]);
  return null;
}

export default function MapView() {
  const [earthquakes, setEarthquakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // toggle sidebar for mobile

  // Fetch recent earthquakes
  const fetchEarthquakes = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
      );
      if (!res.ok) throw new Error("Network failed");
      const data = await res.json();
      const sorted = data.features.sort(
        (a, b) => b.properties.time - a.properties.time
      );
      setEarthquakes(sorted);
      setError("");
    } catch {
      setError("⚠️ Failed to load earthquake data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarthquakes();
    // Fix for mobile map sizing
    setTimeout(() => window.dispatchEvent(new Event("resize")), 500);
  }, []);

  // --- Handle different states ---
  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-gray-600 text-lg animate-pulse">
          Loading earthquakes...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <p className="text-red-600 font-semibold mb-2">{error}</p>
        <button
          onClick={fetchEarthquakes}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Retry 🔁
        </button>
      </div>
    );

  if (!earthquakes.length)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <p className="text-gray-700">No earthquake data found.</p>
      </div>
    );

  // --- Main layout ---
  return (
    <div className="relative flex flex-col md:flex-row w-full h-[80vh] md:h-[85vh] mt-3 px-2 md:px-6 gap-3">
      {/* Mobile toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-3 left-3 z-[1000] bg-blue-600 text-white p-2 rounded-md shadow-md md:hidden"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`absolute md:static top-0 left-0 z-[999] bg-white shadow-md rounded-md overflow-y-auto p-4 transform transition-transform duration-300 ease-in-out 
          w-3/4 sm:w-1/2 md:w-1/3 lg:w-1/4 h-[80vh] md:h-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-800">
            Top 10 Recent Quakes
          </h2>
          <button
            onClick={fetchEarthquakes}
            className="bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm hover:bg-blue-700 text-sm"
          >
            Refresh 🔄
          </button>
        </div>

        <ul className="divide-y divide-gray-200">
          {earthquakes.slice(0, 10).map((eq) => {
            const [lon, lat] = eq.geometry.coordinates;
            const { mag, place, time } = eq.properties;
            const date = new Date(time).toLocaleTimeString();
            const color =
              mag >= 6
                ? "text-red-600"
                : mag >= 4
                ? "text-orange-500"
                : "text-green-600";

            return (
              <li
                key={eq.id}
                onClick={() => {
                  setSelectedCoords([lat, lon]);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className="py-2 cursor-pointer hover:bg-blue-50 px-2 rounded-md transition"
              >
                <div className="flex justify-between">
                  <span className={`font-bold ${color}`}>M{mag.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">{date}</span>
                </div>
                <p className="text-sm text-gray-700 truncate">{place}</p>
              </li>
            );
          })}
        </ul>

        {/* Legend */}
        <div className="mt-3 border-t pt-2 text-xs text-gray-600">
          <p className="font-semibold mb-1">Legend:</p>
          <div className="flex gap-2 flex-wrap">
            <span className="flex items-center">
              <span className="w-3 h-3 bg-red-600 rounded-full mr-1"></span> ≥6.0
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-orange-500 rounded-full mr-1"></span> 4.0–5.9
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></span> 2.0–3.9
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 bg-green-600 rounded-full mr-1"></span> &lt;2.0
            </span>
          </div>
        </div>
      </aside>

      {/* Map */}
      <div className="flex-1 h-[60vh] md:h-full rounded-lg overflow-hidden shadow-md z-[1]">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          />
          <FlyToLocation coordinates={selectedCoords} />

          {earthquakes.map((eq) => {
            const [lon, lat] = eq.geometry.coordinates;
            const { mag, place, time } = eq.properties;
            const date = new Date(time).toLocaleString();
            const color =
              mag >= 6 ? "red" : mag >= 4 ? "orange" : mag >= 2 ? "yellow" : "green";
            const icon = L.divIcon({
              html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>`,
            });
            return (
              <Marker key={eq.id} position={[lat, lon]} icon={icon}>
                <Popup>
                  <div>
                    <p className="font-semibold">{place}</p>
                    <p>Magnitude: {mag.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">{date}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

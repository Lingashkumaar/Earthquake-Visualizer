import React from "react";
import Header from "./components/Header";
import MapView from "./components/MapView";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="grow flex flex-col items-center">
        <MapView />
      </main>
    </div>
  );
}

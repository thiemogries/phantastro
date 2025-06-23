import React from "react";
import WeatherApp from "./components/WeatherApp";
import "./App.css";

// Import API test functions in development mode
if (process.env.NODE_ENV === 'development') {
  import('./test-api-response');
}

function App() {
  return (
    <div className="App">
      <WeatherApp />
    </div>
  );
}

export default App;

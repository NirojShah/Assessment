import React from "react";
import Dashboard from "./Dashboard";
import Header from "./Header";

const App = () => {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Header />
      <Dashboard />
    </div>
  );
};

export default App;

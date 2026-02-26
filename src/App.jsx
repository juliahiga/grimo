import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Personagens from "./pages/Personagens";
import Campanhas from "./pages/Campanhas";
import Sistemas from "./pages/Sistemas";
import Profile from "./pages/Profile";
import NovoTlouRpg from "./pages/NovoTlouRpg"; // import da nova página

function App() {
  return (
    <GoogleOAuthProvider clientId="333908666788-dv1sl8hn8csfn5290o9d6sh0h9v5433p.apps.googleusercontent.com">
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/personagens" element={<Personagens />} />
          <Route path="/campanhas" element={<Campanhas />} />
          <Route path="/sistemas" element={<Sistemas />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/novo-tlourpg" element={<NovoTlouRpg />} /> {/* nova rota */}
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
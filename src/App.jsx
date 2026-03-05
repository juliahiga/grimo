import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { UserProvider } from "./context/UserContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Personagens from "./pages/Personagens";
import Campanhas from "./pages/Campanhas";
import Sistemas from "./pages/Sistemas";
import Profile from "./pages/Profile";
import NovoTlouRpg from "./pages/NovoTlouRpg";
import NovaCampanhaTlouRpg from "./pages/NovaCampanhaTlouRpg";
import FichaPersonagem from "./pages/FichaPersonagem";
import CampanhaTlou from "./pages/CampanhaTlou";

function App() {
  return (
    <GoogleOAuthProvider clientId="333908666788-dv1sl8hn8csfn5290o9d6sh0h9v5433p.apps.googleusercontent.com">
      <UserProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/personagens" element={<Personagens />} />
            <Route path="/ficha/:id" element={<FichaPersonagem />} />
            <Route path="/campanhas" element={<Campanhas />} />
            <Route path="/campanha/:id" element={<CampanhaTlou />} />
            <Route path="/sistemas" element={<Sistemas />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/novo-tlourpg" element={<NovoTlouRpg />} />
            <Route path="/nova-campanha-tlourpg" element={<NovaCampanhaTlouRpg />} />
          </Routes>
        </Router>
      </UserProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
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
import FichaPersonagemTlou   from "./pages/FichaPersonagemTlou";
import FichaPersonagemNaruto from "./pages/FichaPersonagemNaruto";
import CampanhaTlou from "./pages/CampanhaTlou";
import EscudoMestre from "./pages/EscudoMestre";
import NovoNaruto from "./pages/NovoNaruto";
import CampanhaNaruto from "./pages/CampanhaNaruto";
import NovaCampanhaNarutoRpg from "./pages/NovaCampanhaNarutoRpg";
import EscudoMestreNaruto from "./pages/EscudoMestreNaruto";
import FichaAnimalInuzuka from "./pages/FichaAnimalInuzuka";

function App() {
  return (
    <GoogleOAuthProvider clientId="333908666788-dv1sl8hn8csfn5290o9d6sh0h9v5433p.apps.googleusercontent.com">
      <UserProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/personagens" element={<Personagens />} />
            <Route path="/naruto/ficha/:id" element={<FichaPersonagemNaruto />} />
            <Route path="/naruto/ficha/:id/animal" element={<FichaAnimalInuzuka />} />
            <Route path="/personagem-naruto/:id" element={<FichaPersonagemNaruto />} />
            <Route path="/personagem-naruto/:id/animal" element={<FichaAnimalInuzuka />} />
            <Route path="/ficha/:id"        element={<FichaPersonagemTlou />} />
            <Route path="/campanhas" element={<Campanhas />} />
            <Route path="/campanha/:id" element={<CampanhaTlou />} />
            <Route path="/entrar-campanha/:id" element={<CampanhaTlou />} />
            <Route path="/escudo-mestre/:id" element={<EscudoMestre />} />
            <Route path="/sistemas" element={<Sistemas />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/novo-tlourpg" element={<NovoTlouRpg />} />
            <Route path="/nova-campanha-tlourpg" element={<NovaCampanhaTlouRpg />} />
            <Route path="/novo-naruto" element={<NovoNaruto />} />
            <Route path="/campanha-naruto/:id" element={<CampanhaNaruto />} />
            <Route path="/entrar-campanha-naruto/:id" element={<CampanhaNaruto />} />
            <Route path="/nova-campanha-naruto" element={<NovaCampanhaNarutoRpg />} />
            <Route path="/escudo-mestre-naruto/:id" element={<EscudoMestreNaruto />} />
          </Routes>
        </Router>
      </UserProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
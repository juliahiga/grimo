import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoVerde from "../assets/verde.png";
import "../styles/Navbar.css";
import { useGoogleLogin } from "@react-oauth/google";
import { useUser } from "../context/UserContext";

const Navbar = () => {
  const { user, setUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();

        const dbRes = await fetch("http://localhost:3001/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            google_id: profile.sub,
            name: profile.name,
            email: profile.email,
            picture: profile.picture,
          }),
        });
        const dbUser = await dbRes.json();

        setUser({
          google_id: dbUser.google_id,
          name: dbUser.name,
          email: dbUser.email,
          picture: dbUser.picture,
        });
      } catch (err) {
        console.log("Erro:", err);
      }
    },
    onError: () => console.log("Erro no login"),
    prompt: "select_account",
    flow: "implicit",
  });

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          <Link to="/"><img src={logoVerde} alt="Logo" className="logo" /></Link>
        </div>
        <nav className="navbar-center">
          <ul>
            <li><Link to="/personagens">Personagens</Link></li>
            <li><Link to="/campanhas">Campanhas</Link></li>
            <li><Link to="/sistemas">Sistemas</Link></li>
          </ul>
        </nav>
        <div className="navbar-right">
          {user ? (
            <div className="avatar-wrapper" ref={menuRef}>
              <img
                src={user.picture}
                alt={user.name}
                className="user-avatar"
                onClick={() => setMenuOpen((prev) => !prev)}
                title={user.name}
              />
              {menuOpen && (
                <div className="avatar-menu">
                  <button onClick={() => { navigate("/perfil"); setMenuOpen(false); }}>
                    Perfil
                  </button>
                  <button onClick={async () => {
                    await fetch("http://localhost:3001/api/users/logout", {
                      method: "POST",
                      credentials: "include",
                    });
                    setUser(null);
                    setMenuOpen(false);
                    navigate("/");
                  }}>
                    Deslogar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="login-btn" onClick={() => login()}>LOGIN</button>
          )}
        </div>
      </header>
      <div className="divider"></div>
    </>
  );
};

export default Navbar;
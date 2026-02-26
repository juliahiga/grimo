import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);

  // Carrega do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUserState(JSON.parse(saved));
  }, []);

  // Salva no localStorage sempre que user mudar
  const setUser = (value) => {
    if (typeof value === "function") {
      setUserState((prev) => {
        const next = value(prev);
        localStorage.setItem("user", JSON.stringify(next));
        return next;
      });
    } else {
      if (value === null) {
        localStorage.removeItem("user");
      } else {
        localStorage.setItem("user", JSON.stringify(value));
      }
      setUserState(value);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
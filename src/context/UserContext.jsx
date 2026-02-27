import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/users/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        console.log("Dados do /me:", data);
        if (data) setUserState(data);
      })
      .catch(() => { });
  }, []);

  const setUser = (value) => {
    if (typeof value === "function") {
      setUserState((prev) => value(prev));
    } else {
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
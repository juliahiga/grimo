import { createContext, useContext, useState, useEffect, useRef } from "react";

const UserContext = createContext();

export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const loginTriggerRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/users/me`, { credentials: "include" })
      .then(res => res.json())
      .then(data => { if (data && data.id) setUserState(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setUser = (value) => {
    if (typeof value === "function") {
      setUserState((prev) => value(prev));
    } else {
      setUserState(value);
    }
  };

  const triggerLogin = () => {
    if (loginTriggerRef.current) loginTriggerRef.current();
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, triggerLogin, loginTriggerRef }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
import { createContext, useContext, useState, useEffect, useRef } from "react";
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const loginTriggerRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/users/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => { if (data) setUserState(data); })
      .catch(() => {});
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
    <UserContext.Provider value={{ user, setUser, triggerLogin, loginTriggerRef }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function Layout({ children }) {
  const [darkMode, setDarkMode] = useState(true);
  const router = useRouter();
  
  // Vérifier si nous sommes sur la page de login
  const isLoginPage = router.pathname === '/login';

  useEffect(() => {
    // Appliquer le thème sombre par défaut (comme Discord)
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isLoginPage && <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />}
      <div className="flex flex-1">
        {!isLoginPage && <Sidebar />}
        <main className={`flex-1 ${!isLoginPage ? 'p-6' : ''} ${isLoginPage ? 'w-full' : ''}`}>{children}</main>
      </div>
    </div>
  );
}
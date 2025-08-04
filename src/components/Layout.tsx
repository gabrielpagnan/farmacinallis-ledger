import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Activity, Plus, History, FileText, LogOut, Menu, X } from 'lucide-react';
import { Session, User } from '@supabase/supabase-js';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Configurar listener de autenticação primeiro
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session && location.pathname !== '/auth') {
          navigate('/auth');
        }
      }
    );

    // Depois verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session && location.pathname !== '/auth') {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      toast({
        title: "Logout realizado com sucesso!",
        description: "Até a próxima!",
      });
      
      navigate('/auth');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no logout",
        description: error.message,
      });
    }
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  // Não renderizar layout se não estiver autenticado
  if (!session || !user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b bg-card farmacinallis-shadow sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Nome */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center farmacinallis-gradient">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Farmacinallis</h1>
                <p className="text-xs text-muted-foreground">Gestão de Matérias-Primas</p>
              </div>
            </div>

            {/* Menu Desktop */}
            <nav className="hidden md:flex items-center space-x-1">
              <Button 
                variant={location.pathname === '/' ? 'default' : 'ghost'}
                onClick={() => navigateTo('/')}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar</span>
              </Button>
              <Button 
                variant={location.pathname === '/historico' ? 'default' : 'ghost'}
                onClick={() => navigateTo('/historico')}
                className="flex items-center space-x-2"
              >
                <History className="w-4 h-4" />
                <span>Histórico</span>
              </Button>
              <Button 
                variant={location.pathname === '/relatorios' ? 'default' : 'ghost'}
                onClick={() => navigateTo('/relatorios')}
                className="flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Relatórios</span>
              </Button>
            </nav>

            {/* Usuário e Logout */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">Farmacinallis</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Menu Mobile */}
            <Button 
              variant="outline" 
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>

          {/* Menu Mobile Expandido */}
          {isMenuOpen && (
            <div className="md:hidden border-t py-4 space-y-2">
              <Button 
                variant={location.pathname === '/' ? 'default' : 'ghost'}
                onClick={() => navigateTo('/')}
                className="w-full justify-start"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar
              </Button>
              <Button 
                variant={location.pathname === '/historico' ? 'default' : 'ghost'}
                onClick={() => navigateTo('/historico')}
                className="w-full justify-start"
              >
                <History className="w-4 h-4 mr-2" />
                Histórico
              </Button>
              <Button 
                variant={location.pathname === '/relatorios' ? 'default' : 'ghost'}
                onClick={() => navigateTo('/relatorios')}
                className="w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Relatórios
              </Button>
              <div className="border-t pt-2">
                <div className="text-sm px-4 py-2">
                  <p className="font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Farmacinallis</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar para o dashboard (que é a página principal)
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
};

export default Index;


import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to scanner page
    navigate('/scanner');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-300 to-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">AttendEase QR Scanner</h1>
        <p className="text-xl text-gray-600">Redirecting to scanner...</p>
      </div>
    </div>
  );
};

export default Index;

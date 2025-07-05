
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { AuthService } from '@/utils/auth';

const AdminLogout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    AuthService.logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/admin-login');
  };

  return (
    <Button
      variant="destructive"
      onClick={handleLogout}
      className="flex items-center space-x-2"
    >
      <span>🚪</span>
      <span>Logout</span>
    </Button>
  );
};

export default AdminLogout;

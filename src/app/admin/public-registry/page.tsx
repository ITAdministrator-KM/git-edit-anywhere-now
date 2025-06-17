import { useEffect } from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import { useNavigate } from '@/hooks/useNavigate';
import { useAuth } from '@/hooks/useAuth';
import { PublicRegistry } from '@/components/staff/PublicRegistry';

export default function AdminPublicRegistryPage() {
  const { user, loading } = useAuth();
  const { navigate } = useNavigation();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <PublicRegistry />
    </div>
  );
}
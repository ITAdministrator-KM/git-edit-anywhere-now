import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import type { PublicUser } from '@/services/apiService';
import { User, ArrowLeft } from 'lucide-react';
import ResponsiveQRScanner from '@/components/ResponsiveQRScanner';

const QRScanPage = () => {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (publicId) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [publicId]);

  const fetchUserData = async () => {
    try {
      const users = await apiService.getPublicUsers();
      let foundUser = users.find(u => u.public_id === publicId);
      
      if (!foundUser && publicId.match(/^PUB\d+$/)) {
        foundUser = users.find(u => u.public_id.replace(/[^0-9]/g, '') === publicId.replace(/[^0-9]/g, ''));
      }

      if (foundUser) {
        setUser(foundUser);
        toast({
          title: "✅ User Found",
          description: `Verified: ${foundUser.name}`,
        });
      } else {
        toast({
          title: "❌ User Not Found",
          description: "No user found with this QR code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: "Database Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScanSuccess = (result: string) => {
    try {
      const qrData = JSON.parse(result);
      if (qrData.public_id) {
        navigate(`/qr-scan/${qrData.public_id}`);
      } else {
        toast({
          title: "Invalid QR Code",
          description: "QR code does not contain valid public ID",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Invalid QR Code",
        description: "Please scan a valid Public ID QR code",
        variant: "destructive",
      });
    }
  };

  const handleQRScanError = (error: any) => {
    console.error('QR Scan error:', error);
    toast({
      title: "Scan Error",
      description: "Failed to scan QR code",
      variant: "destructive",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading QR scanner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            📱 QR Scanner Portal
            <span className="text-lg font-normal text-gray-600">
              {publicId ? `- ${publicId}` : '- Multi-Device Scanner'}
            </span>
          </h1>
          <Button variant="outline" onClick={() => navigate('/staff')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {publicId && user ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-blue-600" />
                  👤 User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg text-blue-800">{user.name}</h3>
                  <p className="text-blue-600 font-medium">ID: {user.public_id}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 w-20">NIC:</span>
                    <span className="font-medium">{user.nic}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 w-20">Mobile:</span>
                    <span className="font-medium">{user.mobile || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 w-20">Email:</span>
                    <span className="font-medium">{user.email || 'Not provided'}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-sm text-gray-600 w-20">Address:</span>
                    <span className="font-medium">{user.address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ResponsiveQRScanner 
              onScanSuccess={handleQRScanSuccess}
              onError={handleQRScanError}
            />
          </div>
        ) : (
          <ResponsiveQRScanner 
            onScanSuccess={handleQRScanSuccess}
            onError={handleQRScanError}
          />
        )}
      </div>
    </div>
  );
};

export default QRScanPage;

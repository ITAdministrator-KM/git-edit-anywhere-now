import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera, QrCode, User, UserPlus, RefreshCw, Calendar, Download, Search, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { apiService } from '@/services/api';
import type { PublicUser } from '@/services/api';
import type { RegistryFormData, PublicRegistryEntry } from '@/types/registry';
import { useToast } from "@/hooks/use-toast";
import { PublicUserForm } from '@/components/public-accounts/PublicUserForm';
import ResponsiveQRScanner from '@/components/ResponsiveQRScanner';

const initialFormState: RegistryFormData = {
  name: '',
  nic: '',
  address: '',
  phone: '',
  department_id: '',
  division_id: '',
  purpose_of_visit: '',
  remarks: '',
  public_id: ''
};

export function PublicRegistry() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [registryEntries, setRegistryEntries] = useState<PublicRegistryEntry[]>([]);
  const [scannedUser, setScannedUser] = useState<PublicUser | null>(null);
  const [visitorType, setVisitorType] = useState<'new' | 'existing'>('new');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<RegistryFormData>(initialFormState);

  useEffect(() => {
    fetchInitialData();
    fetchTodayEntries();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [depts, divs] = await Promise.all([
        apiService.getDepartments(),
        apiService.getDivisions()
      ]);
      setDepartments(depts);
      setDivisions(divs);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchTodayEntries = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const entries = await apiService.getRegistryEntries(today);
      setRegistryEntries(entries);
    } catch (error) {
      console.error('Error fetching registry entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch registry entries",
        variant: "destructive",
      });
    }
  };

  const handlePublicIdLookup = async (publicId: string) => {
    if (!publicId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Public ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const users = await apiService.getPublicUsers();
      const user = users.find(u => u.public_id === publicId);
      
      if (user) {
        setScannedUser(user);
        setFormData(prev => ({
          ...prev,
          name: user.name,
          nic: user.nic,
          address: user.address,
          phone: user.phone || '',
          department_id: user.department_id?.toString() || '',
          division_id: user.division_id?.toString() || ''
        }));
        
        toast({
          title: "User Found",
          description: `Welcome back, ${user.name}!`,
        });
      } else {
        toast({
          title: "User Not Found",
          description: "No user found with this ID",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to lookup user",
        variant: "destructive",
      });
    }
  };

  const handleQRScan = (result: string) => {
    try {
      const qrData = JSON.parse(result);
      if (qrData.public_id) {
        handlePublicIdLookup(qrData.public_id);
        setShowQRScanner(false);
      }
    } catch (error) {
      toast({
        title: "Invalid QR Code",
        description: "Please scan a valid Public ID QR code",
        variant: "destructive",
      });
    }
  };

  const handleCreateAccount = async (userData: any) => {
    try {
      setIsSubmitting(true);
      const newUser = await apiService.createPublicUser(userData);
      
      toast({
        title: "Account Created",
        description: `Public ID: ${newUser.public_id}`,
      });

      // Auto-proceed to registry entry
      setScannedUser(newUser);
      setVisitorType('existing');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistrySubmit = async () => {
    if (!formData.purpose_of_visit.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the purpose of visit",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const registryData = {
        public_user_id: scannedUser?.id,
        visitor_name: formData.name,
        visitor_nic: formData.nic,
        visitor_address: formData.address,
        visitor_phone: formData.phone,
        department_id: parseInt(formData.department_id),
        division_id: formData.division_id ? parseInt(formData.division_id) : null,
        purpose_of_visit: formData.purpose_of_visit,
        remarks: formData.remarks,
        visitor_type: visitorType,
        created_by: user?.id
      };

      const response = await apiService.createRegistryEntry(registryData);
      
      toast({
        title: "Entry Recorded",
        description: `Registry ID: ${response.registry_id}`,
      });

      // Reset form      setFormData(initialFormState);
      setScannedUser(null);
      setVisitorType('new');
      
      // Refresh entries
      fetchTodayEntries();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToPDF = () => {
    // Implementation for PDF export
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Time', 'Name', 'NIC', 'Department', 'Purpose', 'Type'],
      ...registryEntries.map(entry => [
        format(new Date(entry.entry_time), 'HH:mm'),
        entry.visitor_name,
        entry.visitor_nic,
        entry.department_name || '',
        entry.purpose_of_visit,
        entry.visitor_type
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registry_${filterDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Public Visitor Registry</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Visitor Type Selection */}
          <div className="space-y-4">
            <RadioGroup
              value={visitorType}
              onValueChange={(value: 'new' | 'existing') => setVisitorType(value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new">New Visitor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing">Existing ID</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Form Content */}
          {visitorType === 'new' ? (
            <PublicUserForm 
              onSubmit={handleCreateAccount}
              onClose={() => {}}
              isLoading={isSubmitting}
            />
          ) : (
            <div className="space-y-4 mt-4">
              <div className="flex gap-4">
                <Button onClick={() => setShowQRScanner(true)}>
                  <Camera className="mr-2" size={16} />
                  Scan QR Code
                </Button>
                <div className="flex-1">
                  <Input
                    placeholder="Enter Public ID"
                    value={formData.public_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, publicId: e.target.value }))}
                  />
                </div>
                <Button onClick={() => handlePublicIdLookup(formData.public_id || '')}>
                  <Search className="mr-2" size={16} />
                  Search
                </Button>
              </div>

              {scannedUser && (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Name</Label>
                          <p className="font-medium">{scannedUser.name}</p>
                        </div>
                        <div>
                          <Label>NIC</Label>
                          <p className="font-medium">{scannedUser.nic}</p>
                        </div>
                        <div>
                          <Label>Department</Label>
                          <p className="font-medium">{scannedUser.department_name || 'Not assigned'}</p>
                        </div>
                        <div>
                          <Label>Division</Label>
                          <p className="font-medium">{scannedUser.division_name || 'Not assigned'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <div>
                      <Label>Purpose of Visit</Label>
                      <Input
                        value={formData.purpose_of_visit}
                        onChange={(e) => setFormData(prev => ({ ...prev, purpose_of_visit: e.target.value }))}
                        placeholder="Enter purpose of visit"
                      />
                    </div>
                    <div>
                      <Label>Remarks (Optional)</Label>
                      <Textarea
                        value={formData.remarks}
                        onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                        placeholder="Add any additional notes"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleRegistrySubmit}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    Submit Entry
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Log Panel */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Today's Entries</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToPDF}>
                <FileDown className="mr-2" size={16} />
                Export PDF
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="mr-2" size={16} />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Select 
              value={filterDepartment}
              onValueChange={setFilterDepartment}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-[200px]"
            />

            <Input
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Entries Table */}
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">NIC</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Purpose</th>
                  <th className="px-6 py-3">Type</th>
                </tr>
              </thead>
              <tbody>
                {registryEntries.map(entry => (
                  <tr key={entry.id} className="bg-white border-b">
                    <td className="px-6 py-4">{format(new Date(entry.entry_time), 'HH:mm')}</td>
                    <td className="px-6 py-4">{entry.visitor_name}</td>
                    <td className="px-6 py-4">{entry.visitor_nic}</td>
                    <td className="px-6 py-4">{entry.department_name}</td>
                    <td className="px-6 py-4">{entry.purpose_of_visit}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        entry.visitor_type === 'new' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {entry.visitor_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveQRScanner
                onScanSuccess={handleQRScan}
                onError={(error) => {
                  console.error('QR scan error:', error);
                  toast({
                    title: "Scan Error",
                    description: "Failed to scan QR code",
                    variant: "destructive",
                  });
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

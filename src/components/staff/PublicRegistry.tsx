
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
import { apiService } from '@/services/apiService';
import type { PublicUser, Department, Division, RegistryEntry } from '@/services/apiService';
import { useToast } from "@/hooks/use-toast";

interface RegistryFormData {
  name: string;
  nic: string;
  address: string;
  phone: string;
  department_id: string;
  division_id: string;
  purpose_of_visit: string;
  remarks: string;
  public_id: string;
}

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

// Simple PublicUserForm component
interface PublicUserFormProps {
  onSubmit: (userData: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

function PublicUserForm({ onSubmit, isLoading }: PublicUserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    email: '',
    username: '',
    password: '',
    address: '',
    phone: '',
    department_id: '',
    division_id: ''
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [depts, divs] = await Promise.all([
        apiService.getDepartments(),
        apiService.getDivisions()
      ]);
      setDepartments(depts);
      setDivisions(divs);
    };
    loadData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Full Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>NIC Number *</Label>
          <Input
            value={formData.nic}
            onChange={(e) => setFormData(prev => ({ ...prev, nic: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Email *</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Username *</Label>
          <Input
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Password *</Label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
      </div>
      
      <div>
        <Label>Address *</Label>
        <Textarea
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Department</Label>
          <Select 
            value={formData.department_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Division</Label>
          <Select 
            value={formData.division_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, division_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select division" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map(div => (
                <SelectItem key={div.id} value={div.id.toString()}>
                  {div.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating Account...' : 'Create Account & Proceed'}
      </Button>
    </form>
  );
}

// Simple QR Scanner component
interface ResponsiveQRScannerProps {
  onScanSuccess: (result: string) => void;
  onError: (error: any) => void;
}

function ResponsiveQRScanner({ onScanSuccess }: ResponsiveQRScannerProps) {
  return (
    <div className="p-4 text-center">
      <QrCode size={48} className="mx-auto mb-4 text-gray-400" />
      <p className="text-gray-600 mb-4">QR Scanner placeholder</p>
      <p className="text-sm text-gray-500">
        QR scanning functionality would be implemented here using a library like html5-qrcode
      </p>
      <Button 
        onClick={() => onScanSuccess(JSON.stringify({ public_id: 'PUB12345' }))}
        className="mt-4"
      >
        Simulate QR Scan
      </Button>
    </div>
  );
}

export function PublicRegistry() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [registryEntries, setRegistryEntries] = useState<RegistryEntry[]>([]);
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
      toast({
        title: "Error",
        description: "Failed to load departments and divisions",
        variant: "destructive",
      });
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
      setFormData(prev => ({
        ...prev,
        name: newUser.name,
        nic: newUser.nic,
        address: newUser.address,
        phone: newUser.phone || '',
        department_id: newUser.department_id?.toString() || '',
        division_id: newUser.division_id?.toString() || ''
      }));
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

    if (!formData.department_id) {
      toast({
        title: "Validation Error",
        description: "Please select a department",
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

      // Reset form
      setFormData(initialFormState);
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

  // Filter entries based on search and filters
  const filteredEntries = registryEntries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.visitor_nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.registry_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !filterDepartment || 
      entry.department_id.toString() === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Public Visitor Registry</h1>
        <p className="text-blue-100">Manage visitor entries and track public services</p>
      </div>

      {/* Registration Form */}
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 rounded-t-xl">
          <CardTitle className="text-2xl text-gray-800 flex items-center gap-2">
            <UserPlus size={24} />
            Visitor Registration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Visitor Type Selection */}
          <div className="mb-6">
            <Label className="text-lg font-semibold mb-3 block">Select Visitor Type</Label>
            <RadioGroup
              value={visitorType}
              onValueChange={(value: 'new' | 'existing') => {
                setVisitorType(value);
                setScannedUser(null);
                setFormData(initialFormState);
              }}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2 bg-green-50 p-3 rounded-lg">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="cursor-pointer">New Visitor</Label>
              </div>
              <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing" className="cursor-pointer">Existing ID</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Form Content */}
          {visitorType === 'new' ? (
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Create New Public Account</h3>
              <PublicUserForm 
                onSubmit={handleCreateAccount}
                onClose={() => {}}
                isLoading={isSubmitting}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* ID Lookup Section */}
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Scan or Enter Public ID</h3>
                <div className="flex gap-4">
                  <Button 
                    onClick={() => setShowQRScanner(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Camera className="mr-2" size={16} />
                    Scan QR Code
                  </Button>
                  <div className="flex-1">
                    <Input
                      placeholder="Enter Public ID (e.g., PUB12345)"
                      value={formData.public_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, public_id: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                  <Button 
                    onClick={() => handlePublicIdLookup(formData.public_id || '')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Search className="mr-2" size={16} />
                    Search
                  </Button>
                </div>
              </div>

              {/* User Details & Registry Form */}
              {scannedUser && (
                <div className="space-y-6">
                  <Card className="bg-gradient-to-r from-green-50 to-blue-50">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">Visitor Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Name</Label>
                          <p className="font-semibold text-gray-800">{scannedUser.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">NIC</Label>
                          <p className="font-semibold text-gray-800">{scannedUser.nic}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Department</Label>
                          <p className="font-semibold text-gray-800">{scannedUser.department_name || 'Not assigned'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Division</Label>
                          <p className="font-semibold text-gray-800">{scannedUser.division_name || 'Not assigned'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Registry Entry Form */}
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">Visit Details</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Department *</Label>
                          <Select 
                            value={formData.department_id}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map(dept => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Division</Label>
                          <Select 
                            value={formData.division_id}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, division_id: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select division" />
                            </SelectTrigger>
                            <SelectContent>
                              {divisions.map(div => (
                                <SelectItem key={div.id} value={div.id.toString()}>
                                  {div.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Purpose of Visit *</Label>
                        <Input
                          value={formData.purpose_of_visit}
                          onChange={(e) => setFormData(prev => ({ ...prev, purpose_of_visit: e.target.value }))}
                          placeholder="Enter purpose of visit"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Remarks (Optional)</Label>
                        <Textarea
                          value={formData.remarks}
                          onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                          placeholder="Add any additional notes"
                          className="mt-1"
                        />
                      </div>

                      <Button 
                        onClick={handleRegistrySubmit}
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 h-12"
                      >
                        {isSubmitting ? 'Recording Entry...' : 'Submit Entry'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Log Panel */}
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 rounded-t-xl">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl text-gray-800 flex items-center gap-2">
              <Calendar size={24} />
              Today's Entries ({filteredEntries.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV} className="border-green-600 text-green-600 hover:bg-green-50">
                <Download className="mr-2" size={16} />
                Export CSV
              </Button>
              <Button variant="outline" onClick={fetchTodayEntries} className="border-blue-600 text-blue-600 hover:bg-blue-50">
                <RefreshCw className="mr-2" size={16} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select 
              value={filterDepartment}
              onValueChange={setFilterDepartment}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
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
          <div className="relative overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gradient-to-r from-blue-50 to-green-50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">Time</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">NIC</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Department</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Purpose</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No entries found for today
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map(entry => (
                    <tr key={entry.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        {format(new Date(entry.entry_time), 'HH:mm')}
                      </td>
                      <td className="px-6 py-4">{entry.visitor_name}</td>
                      <td className="px-6 py-4">{entry.visitor_nic}</td>
                      <td className="px-6 py-4">{entry.department_name}</td>
                      <td className="px-6 py-4 max-w-xs truncate">{entry.purpose_of_visit}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          entry.visitor_type === 'new' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {entry.visitor_type}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
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
              <Button 
                variant="outline" 
                onClick={() => setShowQRScanner(false)}
                className="w-full mt-4"
              >
                Close Scanner
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

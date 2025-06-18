
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiService, type PublicUser, type Department, type Division, type RegistryEntry } from '@/services/apiService';
import { UserPlus, QrCode, Search, Download, Filter, Clock, Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const PublicRegistry = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('new-visitor');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [registryEntries, setRegistryEntries] = useState<RegistryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  const [newVisitorForm, setNewVisitorForm] = useState({
    name: '',
    nic: '',
    address: '',
    phone: '',
    department_id: '',
    purpose_of_visit: '',
    remarks: ''
  });

  const [existingVisitorForm, setExistingVisitorForm] = useState({
    public_user_id: '',
    purpose_of_visit: '',
    remarks: ''
  });

  useEffect(() => {
    fetchDepartments();
    fetchDivisions();
    fetchPublicUsers();
    fetchRegistryEntries();
  }, []);

  useEffect(() => {
    fetchRegistryEntries();
  }, [selectedDate, selectedDepartment, searchTerm]);

  const fetchDepartments = async () => {
    try {
      const data = await apiService.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const data = await apiService.getDivisions();
      setDivisions(data);
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const fetchPublicUsers = async () => {
    try {
      const data = await apiService.getPublicUsers();
      setPublicUsers(data);
    } catch (error) {
      console.error('Error fetching public users:', error);
    }
  };

  const fetchRegistryEntries = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getRegistryEntries(selectedDate, selectedDepartment, searchTerm);
      setRegistryEntries(data);
    } catch (error) {
      console.error('Error fetching registry entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch registry entries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVisitorForm.name || !newVisitorForm.nic || !newVisitorForm.department_id || !newVisitorForm.purpose_of_visit) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create public user first
      const publicUserData = {
        name: newVisitorForm.name,
        nic: newVisitorForm.nic,
        address: newVisitorForm.address || '',
        phone: newVisitorForm.phone || '',
        mobile: newVisitorForm.phone || '',
        email: '',
        username: `user_${Date.now()}`,
        department_id: parseInt(newVisitorForm.department_id),
        status: 'active'
      };

      const newUser = await apiService.createPublicUser(publicUserData);

      // Create registry entry
      const registryData = {
        public_user_id: newUser.id,
        visitor_name: newVisitorForm.name,
        visitor_nic: newVisitorForm.nic,
        visitor_address: newVisitorForm.address,
        visitor_phone: newVisitorForm.phone,
        department_id: parseInt(newVisitorForm.department_id),
        purpose_of_visit: newVisitorForm.purpose_of_visit,
        remarks: newVisitorForm.remarks,
        visitor_type: 'new' as const
      };

      await apiService.createRegistryEntry(registryData);

      toast({
        title: "Success",
        description: "New visitor registered successfully",
      });

      // Reset form
      setNewVisitorForm({
        name: '',
        nic: '',
        address: '',
        phone: '',
        department_id: '',
        purpose_of_visit: '',
        remarks: ''
      });

      setIsDialogOpen(false);
      fetchRegistryEntries();
      fetchPublicUsers();
    } catch (error: any) {
      console.error('Error registering new visitor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to register visitor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExistingVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!existingVisitorForm.public_user_id || !existingVisitorForm.purpose_of_visit) {
      toast({
        title: "Error",
        description: "Please select a user and enter purpose of visit",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const selectedUser = publicUsers.find(u => u.id === parseInt(existingVisitorForm.public_user_id));
      if (!selectedUser) {
        throw new Error("Selected user not found");
      }

      const registryData = {
        public_user_id: selectedUser.id,
        visitor_name: selectedUser.name,
        visitor_nic: selectedUser.nic,
        visitor_address: selectedUser.address,
        visitor_phone: selectedUser.phone || selectedUser.mobile,
        department_id: selectedUser.department_id || 1,
        purpose_of_visit: existingVisitorForm.purpose_of_visit,
        remarks: existingVisitorForm.remarks,
        visitor_type: 'existing' as const
      };

      await apiService.createRegistryEntry(registryData);

      toast({
        title: "Success",
        description: "Existing visitor registered successfully",
      });

      // Reset form
      setExistingVisitorForm({
        public_user_id: '',
        purpose_of_visit: '',
        remarks: ''
      });

      setIsDialogOpen(false);
      fetchRegistryEntries();
    } catch (error: any) {
      console.error('Error registering existing visitor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to register visitor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Time', 'Registry ID', 'Name', 'NIC', 'Department', 'Purpose', 'Type'];
    const csvContent = [
      headers.join(','),
      ...registryEntries.map(entry => [
        format(new Date(entry.entry_time), 'HH:mm'),
        entry.registry_id,
        entry.visitor_name,
        entry.visitor_nic,
        entry.department_name || '',
        entry.purpose_of_visit,
        entry.visitor_type
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `registry_${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Public Visitor Registry</h2>
          <p className="text-gray-600 mt-1">Manage visitor entries and track public services</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="mr-2" size={20} />
              Register Visitor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register New Visitor</DialogTitle>
              <DialogDescription>
                Register a new visitor or check-in an existing public user
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new-visitor">New Visitor</TabsTrigger>
                <TabsTrigger value="existing-user">Existing User</TabsTrigger>
              </TabsList>
              
              <TabsContent value="new-visitor">
                <form onSubmit={handleNewVisitorSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={newVisitorForm.name}
                        onChange={(e) => setNewVisitorForm({...newVisitorForm, name: e.target.value})}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nic">NIC Number *</Label>
                      <Input
                        id="nic"
                        value={newVisitorForm.nic}
                        onChange={(e) => setNewVisitorForm({...newVisitorForm, nic: e.target.value})}
                        placeholder="Enter NIC number"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={newVisitorForm.address}
                      onChange={(e) => setNewVisitorForm({...newVisitorForm, address: e.target.value})}
                      placeholder="Enter address"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={newVisitorForm.phone}
                        onChange={(e) => setNewVisitorForm({...newVisitorForm, phone: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select
                        value={newVisitorForm.department_id}
                        onValueChange={(value) => setNewVisitorForm({...newVisitorForm, department_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose of Visit *</Label>
                    <Textarea
                      id="purpose"
                      value={newVisitorForm.purpose_of_visit}
                      onChange={(e) => setNewVisitorForm({...newVisitorForm, purpose_of_visit: e.target.value})}
                      placeholder="Enter purpose of visit"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={newVisitorForm.remarks}
                      onChange={(e) => setNewVisitorForm({...newVisitorForm, remarks: e.target.value})}
                      placeholder="Additional remarks"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Registering...' : 'Register Visitor'}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="existing-user">
                <form onSubmit={handleExistingVisitorSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="existing-user">Select User *</Label>
                    <Select
                      value={existingVisitorForm.public_user_id}
                      onValueChange={(value) => setExistingVisitorForm({...existingVisitorForm, public_user_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select existing user" />
                      </SelectTrigger>
                      <SelectContent>
                        {publicUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name} - {user.public_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="existing-purpose">Purpose of Visit *</Label>
                    <Textarea
                      id="existing-purpose"
                      value={existingVisitorForm.purpose_of_visit}
                      onChange={(e) => setExistingVisitorForm({...existingVisitorForm, purpose_of_visit: e.target.value})}
                      placeholder="Enter purpose of visit"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="existing-remarks">Remarks</Label>
                    <Textarea
                      id="existing-remarks"
                      value={existingVisitorForm.remarks}
                      onChange={(e) => setExistingVisitorForm({...existingVisitorForm, remarks: e.target.value})}
                      placeholder="Additional remarks"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Registering...' : 'Register Visit'}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Today's Visitors</p>
                <p className="text-2xl font-bold">{registryEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="text-green-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">New Accounts</p>
                <p className="text-2xl font-bold">
                  {registryEntries.filter(e => e.visitor_type === 'new').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-purple-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Active Entries</p>
                <p className="text-2xl font-bold">
                  {registryEntries.filter(e => e.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="text-orange-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Last Entry</p>
                <p className="text-sm font-semibold">
                  {registryEntries.length > 0 
                    ? format(new Date(registryEntries[0].entry_time), 'HH:mm')
                    : 'None'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Registry Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department-filter">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, NIC, or registry ID"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Actions</Label>
              <Button onClick={exportToCSV} variant="outline" className="w-full">
                <Download className="mr-2" size={16} />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registry Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registry Entries ({format(new Date(selectedDate), 'PPP')})</CardTitle>
          <CardDescription>
            Real-time visitor log with auto-refresh
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Registry ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>NIC</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registryEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {format(new Date(entry.entry_time), 'HH:mm')}
                      </TableCell>
                      <TableCell>{entry.registry_id}</TableCell>
                      <TableCell>{entry.visitor_name}</TableCell>
                      <TableCell>{entry.visitor_nic}</TableCell>
                      <TableCell>{entry.department_name || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">{entry.purpose_of_visit}</TableCell>
                      <TableCell>
                        <Badge variant={entry.visitor_type === 'new' ? 'default' : 'secondary'}>
                          {entry.visitor_type === 'new' ? 'New' : 'Existing'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.status === 'active' ? 'default' : 'secondary'}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {registryEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        No entries found for the selected criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicRegistry;

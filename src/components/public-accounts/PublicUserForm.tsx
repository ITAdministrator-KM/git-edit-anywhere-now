
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import type { PublicUser, Department, Division } from '@/services/apiService';
import { apiService } from '@/services/apiService';

interface PublicUserFormProps {
  user?: PublicUser | null;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isLoading: boolean;
}

export const PublicUserForm = ({ user, onSubmit, onClose, isLoading }: PublicUserFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    address: '',
    mobile: '',
    email: '',
    username: '',
    password: '',
    department_id: 0,
    division_id: 0,
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  useEffect(() => {
    fetchDepartments();
    fetchDivisions();
    
    if (user) {
      setFormData({
        name: user.name || '',
        nic: user.nic || '',
        address: user.address || '',
        mobile: user.mobile || '',
        email: user.email || '',
        username: user.username || '',
        password: '',
        department_id: user.department_id || 0,
        division_id: user.division_id || 0,
      });
    }
  }, [user]);

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await apiService.getDivisions();
      setDivisions(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching divisions:', error);
      setDivisions([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = user 
      ? { id: user.id, ...formData }
      : formData;
    
    onSubmit(submitData);
  };

  const getFilteredDivisions = () => {
    return divisions.filter(d => d.department_id === formData.department_id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{user ? 'Edit Public User' : 'Create Public User'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-name-field">Full Name *</Label>
                <Input
                  id="user-name-field"
                  name="user-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="Enter full name"
                  required
                  autoComplete="name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-nic-field">NIC *</Label>
                <Input
                  id="user-nic-field"
                  name="user-nic"
                  value={formData.nic}
                  onChange={(e) => setFormData(prev => ({...prev, nic: e.target.value}))}
                  placeholder="Enter NIC number"
                  required
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-mobile-field">Mobile *</Label>
                <Input
                  id="user-mobile-field"
                  name="user-mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({...prev, mobile: e.target.value}))}
                  placeholder="Enter mobile number"
                  required
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-email-field">Email</Label>
                <Input
                  id="user-email-field"
                  name="user-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                  placeholder="Enter email address"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-username-field">Username *</Label>
                <Input
                  id="user-username-field"
                  name="user-username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-password-field">Password {!user && '*'}</Label>
                <Input
                  id="user-password-field"
                  name="user-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                  placeholder={user ? "Leave blank to keep current" : "Enter password"}
                  required={!user}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-department-field">Department</Label>
                <Select 
                  value={formData.department_id.toString()} 
                  onValueChange={(value) => setFormData(prev => ({...prev, department_id: parseInt(value), division_id: 0}))}
                >
                  <SelectTrigger id="user-department-field" name="user-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-division-field">Division</Label>
                <Select 
                  value={formData.division_id.toString()} 
                  onValueChange={(value) => setFormData(prev => ({...prev, division_id: parseInt(value)}))}
                  disabled={!formData.department_id}
                >
                  <SelectTrigger id="user-division-field" name="user-division">
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Division</SelectItem>
                    {getFilteredDivisions().map((div) => (
                      <SelectItem key={div.id} value={div.id.toString()}>
                        {div.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-address-field">Address *</Label>
              <Input
                id="user-address-field"
                name="user-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                placeholder="Enter full address"
                required
                autoComplete="street-address"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Processing...' : user ? 'Update User' : 'Create User'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};


import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

import StaffLayout from './staff/StaffLayout';
import { apiService, type ServiceCatalog } from '@/services/apiService';

const ServiceCatalogManagement = () => {
  const [activeTab, setActiveTab] = useState('service-catalog');
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCatalog | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    service_name: '',
    service_code: '',
    description: '',
    department_name: '',
    icon: '',
    fee_amount: '',
    processing_time_days: '',
    category: '',
    duration_minutes: '',
    status: 'active',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await apiService.getServices();
      setServices(data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setSelectedService(null);
    resetForm();
  };

  const handleCreate = () => {
    setIsDialogOpen(true);
    setIsEditing(false);
  };

  const handleEdit = (service: ServiceCatalog) => {
    setIsDialogOpen(true);
    setIsEditing(true);
    setSelectedService(service);
    setFormData({
      service_name: service.service_name,
      service_code: service.service_code,
      description: service.description,
      department_name: service.department_name || '',
      icon: service.icon,
      fee_amount: service.fee_amount?.toString() || '',
      processing_time_days: service.processing_time_days?.toString() || '',
      category: service.category || '',
      duration_minutes: service.duration_minutes?.toString() || '',
      status: service.status,
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteService(id);
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      fetchServices();
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const serviceData = {
        service_name: formData.service_name,
        service_code: formData.service_code,
        description: formData.description,
        department_name: formData.department_name,
        icon: formData.icon,
        fee_amount: parseFloat(formData.fee_amount) || 0,
        processing_time_days: parseInt(formData.processing_time_days) || 0,
        category: formData.category,
        duration_minutes: parseInt(formData.duration_minutes) || 0,
        status: formData.status,
      };

      if (isEditing && selectedService) {
        await apiService.updateService(selectedService.id, serviceData);
        toast({
          title: "Success",
          description: "Service updated successfully",
        });
      } else {
        await apiService.createService(serviceData);
        toast({
          title: "Success",
          description: "Service created successfully",
        });
      }
      fetchServices();
      handleDialogClose();
    } catch (error) {
      console.error('Failed to save service:', error);
      toast({
        title: "Error",
        description: "Failed to save service",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      service_name: '',
      service_code: '',
      description: '',
      department_name: '',
      icon: '',
      fee_amount: '',
      processing_time_days: '',
      category: '',
      duration_minutes: '',
      status: 'active',
    });
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.service_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || service.department_name === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <StaffLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="container mx-auto py-6">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Service Catalog Management</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{isEditing ? 'Edit Service' : 'Create Service'}</DialogTitle>
                  <DialogDescription>
                    {isEditing ? 'Edit the service details.' : 'Add a new service to the catalog.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="service_name" className="text-right">
                      Name
                    </Label>
                    <Input type="text" id="service_name" value={formData.service_name} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="service_code" className="text-right">
                      Code
                    </Label>
                    <Input type="text" id="service_code" value={formData.service_code} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea id="description" value={formData.description} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="department_name" className="text-right">
                      Department
                    </Label>
                    <Input type="text" id="department_name" value={formData.department_name} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="icon" className="text-right">
                      Icon
                    </Label>
                    <Input type="text" id="icon" value={formData.icon} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fee_amount" className="text-right">
                      Fee Amount
                    </Label>
                    <Input type="text" id="fee_amount" value={formData.fee_amount} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="processing_time_days" className="text-right">
                      Processing Time (Days)
                    </Label>
                    <Input type="text" id="processing_time_days" value={formData.processing_time_days} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <Input type="text" id="category" value={formData.category} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="duration_minutes" className="text-right">
                      Duration (Minutes)
                    </Label>
                    <Input type="text" id="duration_minutes" value={formData.duration_minutes} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prevState => ({ ...prevState, status: value }))}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" onClick={handleSubmit}>
                  {isEditing ? 'Update Service' : 'Create Service'}
                </Button>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Administrative">Administrative</SelectItem>
                  <SelectItem value="SSO">SSO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="my-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">Loading...</TableCell>
                    </TableRow>
                  ) : filteredServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">No services found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.service_code}</TableCell>
                        <TableCell>{service.service_name}</TableCell>
                        <TableCell>{service.description}</TableCell>
                        <TableCell>{service.department_name}</TableCell>
                        <TableCell>{service.status}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(service)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
};

export default ServiceCatalogManagement;

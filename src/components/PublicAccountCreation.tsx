
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Loader2, Plus, Search, X, Edit, Trash2, Users, Check, X as XIcon, Eye, EyeOff } from 'lucide-react';

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Services - Use apiService for consistency
import { apiService, type PublicUser, type Department, type Division } from '@/services/apiService';

// Components
import { PublicUserIDCard } from './PublicUserIDCard';

// Enhanced form validation schema
const formSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, and basic punctuation'),
  nic: z.string()
    .min(10, 'NIC must be at least 10 characters')
    .max(12, 'NIC cannot exceed 12 characters')
    .regex(/^[0-9]{9}[vVxX]?$|^[0-9]{12}$/, 'Invalid NIC format. Use 9 digits with optional V/X or 12 digits'),
  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address cannot exceed 200 characters'),
  mobile: z.string()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(12, 'Mobile number cannot exceed 12 digits')
    .regex(/^[0-9+]+$/, 'Mobile number can only contain numbers and +'),
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  username: z.string()
    .min(4, 'Username must be at least 4 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  department_id: z.string().min(1, 'Department is required'),
  division_id: z.string().min(1, 'Division is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.email && data.email.trim() !== '') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  }
  return true;
}, {
  message: 'Invalid email format',
  path: ['email']
});

type FormData = z.infer<typeof formSchema>;

const PublicAccountCreation = () => {
  // Component state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showIdCard, setShowIdCard] = useState(false);
  const [createdUser, setCreatedUser] = useState<PublicUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  
  const { toast } = useToast();

  // Form state with enhanced error handling
  const { 
    register, 
    handleSubmit, 
    reset, 
    watch, 
    setValue, 
    trigger,
    control,
    formState: { errors, isDirty, isValid, isSubmitting } 
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      nic: '',
      address: '',
      mobile: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      department_id: '',
      division_id: ''
    },
    mode: 'onChange',
    criteriaMode: 'all'
  });
  
  const selectedDepartmentId = watch('department_id');
  const selectedDivisionId = watch('division_id');
  const password = watch('password');

  // Memoize filtered divisions to prevent unnecessary re-renders
  const filteredDivisions = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return divisions.filter(d => d.department_id === parseInt(selectedDepartmentId));
  }, [selectedDepartmentId, divisions]);

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: 'Weak', color: 'bg-red-500' };
    
    let score = 0;
    // Length check
    if (password.length >= 8) score++;
    // Has uppercase
    if (/[A-Z]/.test(password)) score++;
    // Has lowercase
    if (/[a-z]/.test(password)) score++;
    // Has number
    if (/[0-9]/.test(password)) score++;
    // Has special char
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };
  
  const passwordStrength = getPasswordStrength(password);

  // Password requirements check
  const passwordRequirements = [
    { id: 'length', label: 'At least 8 characters', validate: (p: string) => p.length >= 8 },
    { id: 'uppercase', label: 'At least 1 uppercase letter', validate: (p: string) => /[A-Z]/.test(p) },
    { id: 'lowercase', label: 'At least 1 lowercase letter', validate: (p: string) => /[a-z]/.test(p) },
    { id: 'number', label: 'At least 1 number', validate: (p: string) => /[0-9]/.test(p) },
    { id: 'special', label: 'At least 1 special character', validate: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  // Reset division when department changes and validate form
  useEffect(() => {
    if (selectedDepartmentId) {
      setValue('division_id', '', { shouldValidate: true });
      trigger('division_id');
    }
  }, [selectedDepartmentId, setValue, trigger]);
  
  // Auto-generate username from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (name && !watch('username')) {
      const username = name.toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
      setValue('username', username, { shouldValidate: true });
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  // Format form errors for display
  const getFormErrors = () => {
    const errorMessages: string[] = [];
    
    Object.entries(errors).forEach(([key, value]) => {
      if (value && value.message) {
        errorMessages.push(value.message as string);
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item && item.message) {
            errorMessages.push(item.message);
          }
        });
      }
    });
    
    return errorMessages;
  };

  // Check if field has error
  const hasError = (field: keyof FormData) => {
    return errors[field] ? 'border-red-500 focus-visible:ring-red-500' : '';
  };

  useEffect(() => {
    fetchPublicUsers();
    fetchDepartments();
    fetchDivisions();
  }, []);

  const fetchPublicUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const users = await apiService.getPublicUsers();
      setPublicUsers(users);
    } catch (error) {
      console.error('Error fetching public users:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch public users",
        variant: "destructive",
      });
      setPublicUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to load departments. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchDivisions = useCallback(async () => {
    try {
      const response = await apiService.getDivisions();
      setDivisions(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching divisions:', error);
      toast({
        title: "Error",
        description: "Failed to load divisions. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmittingForm(true);
      
      // Validate form data
      const validationResult = formSchema.safeParse(data);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map(issue => issue.message).join('\n');
        throw new Error(`Validation failed: ${errorMessages}`);
      }

      // Prepare user data
      const userData = {
        name: data.name.trim(),
        nic: data.nic.trim(),
        address: data.address.trim(),
        mobile: data.mobile.trim(),
        email: data.email?.trim() || undefined,
        username: data.username.trim(),
        password: data.password,
        department_id: data.department_id ? parseInt(data.department_id) : undefined,
        division_id: data.division_id ? parseInt(data.division_id) : undefined,
        status: 'active' as const
      };

      // Call API to create user
      const response = await apiService.createPublicUser(userData);

      // Handle response - now response should be the PublicUser directly
      if (response && response.id) {
        // Create proper ID card user object with required properties
        const idCardUser = {
          ...response,
          mobile: response.mobile || data.mobile.trim(), // Ensure mobile is available
          public_user_id: response.public_id || 'Unknown',
          dateOfBirth: new Date().toISOString().split('T')[0] // Default date
        };
        
        setCreatedUser(idCardUser);
        
        toast({
          title: "Success",
          description: "Public account created successfully",
        });
        
        reset();
        setIsDialogOpen(false);
        setShowIdCard(true);
        fetchPublicUsers(); // Refresh the list
      } else {
        throw new Error('Failed to create account');
      }
    } catch (error) {
      console.error('Error creating public account:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Memoized filtered users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return publicUsers;
    
    const searchLower = searchTerm.toLowerCase();
    return publicUsers.filter(user => (
      (user.name?.toLowerCase().includes(searchLower) || '') ||
      (user.public_id?.toLowerCase().includes(searchLower) || '') ||
      (user.nic?.toLowerCase().includes(searchLower) || '') ||
      (user.email?.toLowerCase().includes(searchLower) || '') ||
      (user.mobile?.toLowerCase().includes(searchLower) || '') ||
      (user.department_name?.toLowerCase().includes(searchLower) || '') ||
      (user.division_name?.toLowerCase().includes(searchLower) || '')
    ));
  }, [publicUsers, searchTerm]);
  
  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Debounced search to prevent too many API calls
  useEffect(() => {
    const timerId = setTimeout(() => {
      fetchPublicUsers();
    }, 500);
    
    return () => clearTimeout(timerId);
  }, [searchTerm, fetchPublicUsers]);

  return (
    <div className="space-y-6">
      {showIdCard && createdUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">ID Card Preview</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowIdCard(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <PublicUserIDCard user={createdUser} />
            <div className="mt-4 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowIdCard(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Public Accounts</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `Total accounts: ${publicUsers.length}`}
              </CardDescription>
            </div>
            <div className="flex space-x-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2" size={20} />
                    Create Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Public Account</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new public user account
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          {...register('name')}
                          placeholder="Enter full name"
                          autoComplete="name"
                          required
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="nic">NIC Number *</Label>
                        <Input
                          id="nic"
                          {...register('nic')}
                          placeholder="Enter NIC number"
                          autoComplete="off"
                          required
                        />
                        {errors.nic && (
                          <p className="text-sm text-red-500">{errors.nic.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Textarea
                        id="address"
                        {...register('address')}
                        placeholder="Enter full address"
                        autoComplete="street-address"
                        required
                      />
                      {errors.address && (
                        <p className="text-sm text-red-500">{errors.address.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Number *</Label>
                        <Input
                          id="mobile"
                          {...register('mobile')}
                          placeholder="+94771234567"
                          autoComplete="tel"
                          required
                        />
                        {errors.mobile && (
                          <p className="text-sm text-red-500">{errors.mobile.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register('email')}
                          placeholder="Enter email address"
                          autoComplete="email"
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="public-department">Department (Optional)</Label>
                        <Select
                          {...register('department_id')}
                          value={selectedDepartmentId}
                          onValueChange={(value) => {
                            setValue('department_id', value);
                          }}
                        >
                          <SelectTrigger id="public-department" className="w-full">
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
                        <small className="text-sm text-gray-500">Select your department if applicable</small>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="public-division">Division (Optional)</Label>
                        <Select
                          {...register('division_id')}
                          value={selectedDivisionId}
                          onValueChange={(value) => setValue('division_id', value)}
                          disabled={!selectedDepartmentId}
                        >
                          <SelectTrigger id="public-division" className="w-full">
                            <SelectValue placeholder={selectedDepartmentId ? "Select division" : "Select department first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredDivisions.map((div) => (
                              <SelectItem key={div.id} value={div.id.toString()}>
                                {div.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <small className="text-sm text-gray-500">
                          {!selectedDepartmentId 
                            ? "Please select a department first"
                            : filteredDivisions.length === 0
                            ? "No divisions available for selected department"
                            : "Select your division within the department if applicable"}
                        </small>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username *</Label>
                        <Input
                          id="username"
                          {...register('username')}
                          placeholder="Enter username"
                          autoComplete="username"
                          required
                        />
                        {errors.username && (
                          <p className="text-sm text-red-500">{errors.username.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          {...register('password')}
                          placeholder="Enter password"
                          autoComplete="new-password"
                          required
                        />
                        {errors.password && (
                          <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...register('confirmPassword')}
                          placeholder="Confirm password"
                          autoComplete="new-password"
                          required
                        />
                        {errors.confirmPassword && (
                          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        {isLoading ? 'Creating...' : 'Create Account'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Public ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">{user.public_id}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.nic}</TableCell>
                    <TableCell>{user.mobile}</TableCell>
                    <TableCell>{user.department_name || '-'}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicAccountCreation;

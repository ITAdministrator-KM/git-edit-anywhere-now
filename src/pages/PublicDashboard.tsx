import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Clock, User, Bell, CreditCard, MapPin, Settings, Search, Download, Calendar, CheckCircle, AlertCircle, Building, Users, FileIcon, Phone } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiService, type PublicUser } from '@/services/apiService';

interface ServiceCategory {
  id: string;
  name: string;
  icon: any;
  description: string;
  services: Service[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  requiredDocs: string[];
  estimatedTime: string;
  fee: string;
}

interface Token {
  id: string;
  number: string;
  service: string;
  status: 'pending' | 'ready' | 'completed';
  estimatedTime: string;
  office: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  service: string;
  date: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'cancelled';
}

const PublicDashboard = () => {
  const [activeTab, setActiveTab] = useState('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState(0);
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const serviceCategories: ServiceCategory[] = [
    {
      id: 'administrative',
      name: 'Administrative Services',
      icon: Building,
      description: 'General administrative services and documentation',
      services: [
        {
          id: 'birth-cert',
          name: 'Birth Certificate',
          description: 'Official birth certificate issuance',
          requiredDocs: ['NIC Copy', 'Hospital Birth Record'],
          estimatedTime: '3-5 days',
          fee: 'Rs. 500'
        },
        {
          id: 'marriage-cert',
          name: 'Marriage Certificate',
          description: 'Official marriage certificate',
          requiredDocs: ['Both NICs', 'Marriage Register Copy'],
          estimatedTime: '2-3 days',
          fee: 'Rs. 750'
        }
      ]
    },
    {
      id: 'business',
      name: 'Business Services',
      icon: Users,
      description: 'Business registration and licensing',
      services: [
        {
          id: 'business-permit',
          name: 'Business Permit',
          description: 'New business registration permit',
          requiredDocs: ['NIC Copy', 'Location Map', 'Business Plan'],
          estimatedTime: '7-10 days',
          fee: 'Rs. 2,500'
        }
      ]
    },
    {
      id: 'planning',
      name: 'Planning & Development',
      icon: MapPin,
      description: 'Urban planning and development permits',
      services: [
        {
          id: 'building-permit',
          name: 'Building Permit',
          description: 'Construction and building permits',
          requiredDocs: ['Land Deed', 'Architectural Plans', 'Survey Report'],
          estimatedTime: '14-21 days',
          fee: 'Rs. 5,000'
        }
      ]
    },
    {
      id: 'social',
      name: 'Social Services',
      icon: User,
      description: 'Community and social welfare services',
      services: [
        {
          id: 'welfare-assistance',
          name: 'Welfare Assistance',
          description: 'Social welfare program application',
          requiredDocs: ['Income Certificate', 'Family Details', 'Bank Statement'],
          estimatedTime: '5-7 days',
          fee: 'Free'
        }
      ]
    },
    {
      id: 'education',
      name: 'Education Services',
      icon: FileText,
      description: 'Educational certificates and verification',
      services: [
        {
          id: 'school-cert',
          name: 'School Certificate',
          description: 'Educational certificate verification',
          requiredDocs: ['Original Certificate', 'NIC Copy'],
          estimatedTime: '1-2 days',
          fee: 'Rs. 300'
        }
      ]
    },
    {
      id: 'health',
      name: 'Health Services',
      icon: Phone,
      description: 'Health-related documentation and permits',
      services: [
        {
          id: 'health-permit',
          name: 'Health Certificate',
          description: 'Health clearance certificate',
          requiredDocs: ['Medical Report', 'NIC Copy'],
          estimatedTime: '2-3 days',
          fee: 'Rs. 1,000'
        }
      ]
    }
  ];

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    if (role !== 'public' || !token) {
      localStorage.clear();
      navigate('/login');
      return;
    }

    if (userId) {
      fetchUserData(parseInt(userId));
      fetchTokens();
      fetchAppointments();
      fetchNotifications();
    }
  }, [navigate]);

  const fetchUserData = async (userId: number) => {
    try {
      const users = await apiService.getPublicUsers();
      const userData = users.find(u => u.id === userId);
      if (userData) {
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchTokens = async () => {
    // Mock data - replace with actual API call
    setTokens([
      {
        id: '1',
        number: 'A001',
        service: 'Birth Certificate',
        status: 'pending',
        estimatedTime: '2 hours',
        office: 'Administrative Division',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        number: 'B003',
        service: 'Business Permit',
        status: 'ready',
        estimatedTime: 'Ready for collection',
        office: 'Business Division',
        createdAt: new Date().toISOString()
      }
    ]);
  };

  const fetchAppointments = async () => {
    // Mock data - replace with actual API call
    setAppointments([
      {
        id: '1',
        service: 'Building Permit Consultation',
        date: '2024-01-15',
        time: '10:00 AM',
        status: 'scheduled'
      }
    ]);
  };

  const fetchNotifications = async () => {
    setNotifications(3);
  };

  const handleServiceBooking = async (service: Service) => {
    try {
      // Mock booking - replace with actual API call
      const newToken: Token = {
        id: Date.now().toString(),
        number: `T${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        service: service.name,
        status: 'pending',
        estimatedTime: service.estimatedTime,
        office: 'Main Office',
        createdAt: new Date().toISOString()
      };
      
      setTokens(prev => [newToken, ...prev]);
      toast({
        title: "Booking Confirmed",
        description: `Your token ${newToken.number} has been generated for ${service.name}`,
      });
      
      setBookingStep(1);
      setSelectedService(null);
      setActiveTab('dashboard');
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const renderServiceCatalog = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <h2 className="text-4xl font-bold mb-4">Book Government Services Online</h2>
        <p className="text-blue-100 text-lg mb-6">Fast, convenient access to all government services</p>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/90 text-gray-800 border-0"
          />
        </div>
      </div>

      {/* Service Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {serviceCategories.map((category) => (
          <Card 
            key={category.id} 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md"
            onClick={() => setSelectedCategory(category.id)}
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <category.icon className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                {category.services.length} services available
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service Details Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">
                  {serviceCategories.find(c => c.id === selectedCategory)?.name}
                </h3>
                <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                  Close
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceCategories.find(c => c.id === selectedCategory)?.services.map((service) => (
                  <Card key={service.id} className="border hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-semibold text-sm">Required Documents:</p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {service.requiredDocs.map((doc, idx) => (
                            <li key={idx}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span><strong>Time:</strong> {service.estimatedTime}</span>
                        <span><strong>Fee:</strong> {service.fee}</span>
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        onClick={() => {
                          setSelectedService(service);
                          setSelectedCategory(null);
                          setBookingStep(2);
                        }}
                      >
                        Book Service
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Flow */}
      {selectedService && bookingStep === 2 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6">Book: {selectedService.name}</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input defaultValue={currentUser?.name || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">NIC Number</label>
                  <Input defaultValue={currentUser?.nic || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mobile Number</label>
                  <Input defaultValue={currentUser?.mobile || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Purpose</label>
                  <Input placeholder="Brief description of your request" />
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedService(null);
                    setBookingStep(1);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                  onClick={() => handleServiceBooking(selectedService)}
                >
                  Confirm Booking
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderUserDashboard = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-800">{tokens.length}</p>
                <p className="text-blue-600 text-sm font-medium">Active Tokens</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-800">{appointments.length}</p>
                <p className="text-green-600 text-sm font-medium">Appointments</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-800">{notifications}</p>
                <p className="text-purple-600 text-sm font-medium">Notifications</p>
              </div>
              <Bell className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-800">2</p>
                <p className="text-yellow-600 text-sm font-medium">Ready</p>
              </div>
              <CheckCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Tokens */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <CreditCard className="h-6 w-6" />
            Active Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-blue-800">{token.number}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{token.service}</p>
                    <p className="text-sm text-gray-600">{token.office}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(token.status)}>
                    {getStatusIcon(token.status)}
                    <span className="ml-1 capitalize">{token.status}</span>
                  </Badge>
                  <p className="text-sm text-gray-500 mt-1">{token.estimatedTime}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Appointments */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Calendar className="h-6 w-6" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{appointment.service}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                  </p>
                </div>
                <Button variant="outline" size="sm">Cancel</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Document Downloads</h2>
      
      <Accordion type="single" collapsible className="space-y-4">
        <AccordionItem value="administrative" className="border rounded-lg">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5" />
              Administrative Division
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <FileIcon className="h-4 w-4" />
                  <span>Business Permit Form (PDF)</span>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <FileIcon className="h-4 w-4" />
                  <span>License Renewal Guide (DOCX)</span>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="planning" className="border rounded-lg">
          <AccordionTrigger className="px-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5" />
              Planning Division
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <FileIcon className="h-4 w-4" />
                  <span>Building Permit Application (PDF)</span>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  const handleLogout = () => {
    localStorage.clear();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  const menuItems = [
    { id: 'catalog', label: 'Service Catalog', icon: FileText },
    { id: 'dashboard', label: 'My Dashboard', icon: User },
    { id: 'documents', label: 'Documents', icon: Download },
    { id: 'profile', label: 'Profile Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100">
      <nav className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DSK Public Portal
            </h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-600 cursor-pointer" />
                {notifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0">
                    {notifications}
                  </Badge>
                )}
              </div>
              <span className="text-gray-700 font-medium">
                Welcome, {currentUser?.name || 'User'}
              </span>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row">
        <aside className="w-full lg:w-64 bg-white/80 backdrop-blur-sm shadow-lg lg:min-h-screen border-r border-blue-200">
          <div className="p-6">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'catalog' && renderServiceCatalog()}
            {activeTab === 'dashboard' && renderUserDashboard()}
            {activeTab === 'documents' && renderDocuments()}
            {activeTab === 'profile' && (
              <div className="text-center py-8">
                <p className="text-gray-600">Profile settings will be available soon.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PublicDashboard;

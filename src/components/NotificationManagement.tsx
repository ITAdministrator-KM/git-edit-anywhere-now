import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Users, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiService, type PublicUser } from '@/services/apiService';

interface NotificationTemplate {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const NotificationManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [notificationType, setNotificationType] = useState<'individual' | 'bulk'>('individual');
  const { toast } = useToast();

  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    recipient_id: ''
  });

  const notificationTemplates: NotificationTemplate[] = [
    {
      id: 'service_complete',
      title: 'Service Completed',
      message: 'Your requested service has been completed and is ready for collection.',
      type: 'success'
    },
    {
      id: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: 'You have an upcoming appointment scheduled for tomorrow.',
      type: 'info'
    },
    {
      id: 'document_ready',
      title: 'Document Ready',
      message: 'Your document is ready for collection. Please visit our office.',
      type: 'success'
    },
    {
      id: 'payment_due',
      title: 'Payment Required',
      message: 'Payment is required to process your application.',
      type: 'warning'
    }
  ];

  useEffect(() => {
    fetchPublicUsers();
  }, []);

  const fetchPublicUsers = async () => {
    try {
      const users = await apiService.getPublicUsers();
      setPublicUsers(Array.isArray(users) ? users : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch public users",
        variant: "destructive",
      });
    }
  };

  const handleTemplateSelect = (template: NotificationTemplate) => {
    setNotificationData({
      ...notificationData,
      title: template.title,
      message: template.message,
      type: template.type
    });
  };

  const handleSendNotification = async () => {
    if (!notificationData.title || !notificationData.message) {
      toast({
        title: "Error",
        description: "Please fill in title and message",
        variant: "destructive",
      });
      return;
    }

    if (notificationType === 'individual' && !notificationData.recipient_id) {
      toast({
        title: "Error",
        description: "Please select a recipient",
        variant: "destructive",
      });
      return;
    }

    if (notificationType === 'bulk' && selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one user for bulk notification",
        variant: "destructive",
      });
      return;
    }

    try {
      // For now, we'll simulate sending notifications
      // In a real implementation, this would call the backend API
      console.log('Sending notification:', {
        type: notificationType,
        data: notificationData,
        recipients: notificationType === 'bulk' ? selectedUsers : [notificationData.recipient_id]
      });

      toast({
        title: "Success",
        description: `Notification sent to ${notificationType === 'bulk' ? selectedUsers.length : 1} user(s)`,
      });

      // Reset form
      setNotificationData({
        title: '',
        message: '',
        type: 'info',
        recipient_id: ''
      });
      setSelectedUsers([]);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-600" size={16} />;
      case 'warning': return <AlertTriangle className="text-yellow-600" size={16} />;
      case 'error': return <AlertCircle className="text-red-600" size={16} />;
      default: return <Info className="text-blue-600" size={16} />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Notification Management</h3>
          <p className="text-gray-600 mt-2">Send notifications to public users about service updates</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Send className="mr-2" size={20} />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Notification</DialogTitle>
              <DialogDescription>
                Send notifications to inform users about service updates
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Notification Type Selection */}
              <div className="space-y-2">
                <Label>Notification Type</Label>
                <Select value={notificationType} onValueChange={(value: 'individual' | 'bulk') => setNotificationType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual User</SelectItem>
                    <SelectItem value="bulk">Bulk Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Templates */}
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="grid grid-cols-2 gap-2">
                  {notificationTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      className="h-auto p-3 text-left"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex items-start space-x-2">
                        {getTypeIcon(template.type)}
                        <div>
                          <div className="font-medium text-sm">{template.title}</div>
                          <div className="text-xs text-gray-500 truncate">{template.message.substring(0, 50)}...</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Recipient Selection */}
              {notificationType === 'individual' ? (
                <div className="space-y-2">
                  <Label>Select Recipient</Label>
                  <Select value={notificationData.recipient_id} onValueChange={(value) => setNotificationData({...notificationData, recipient_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {publicUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.public_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Select Recipients ({selectedUsers.length} selected)</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {publicUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 p-1">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.id.toString())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id.toString()]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id.toString()));
                            }
                          }}
                        />
                        <label htmlFor={`user-${user.id}`} className="text-sm">
                          {user.name} ({user.public_id})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Type */}
              <div className="space-y-2">
                <Label>Message Type</Label>
                <Select value={notificationData.type} onValueChange={(value: 'info' | 'success' | 'warning' | 'error') => setNotificationData({...notificationData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title and Message */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={notificationData.title}
                    onChange={(e) => setNotificationData({...notificationData, title: e.target.value})}
                    placeholder="Enter notification title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={notificationData.message}
                    onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
                    placeholder="Enter notification message"
                    rows={4}
                  />
                </div>
              </div>

              {/* Preview */}
              {notificationData.title && notificationData.message && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center space-x-2 mb-2">
                      {getTypeIcon(notificationData.type)}
                      <span className="font-medium">{notificationData.title}</span>
                      <Badge className={getTypeBadgeColor(notificationData.type)}>{notificationData.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-700">{notificationData.message}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendNotification} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="mr-2" size={16} />
                  Send Notification
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2" size={20} />
            Recent Notifications
          </CardTitle>
          <CardDescription>Latest notifications sent to public users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Sample notification history */}
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
              <div className="flex-1">
                <p className="font-medium text-sm">Service Completed</p>
                <p className="text-xs text-gray-500">Sent to Ahmed Mohamed - 2 hours ago</p>
              </div>
              <Badge className="bg-green-100 text-green-800">success</Badge>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Info className="text-blue-600" size={20} />
              <div className="flex-1">
                <p className="font-medium text-sm">Appointment Reminder</p>
                <p className="text-xs text-gray-500">Sent to Fatima Ibrahim - 4 hours ago</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">info</Badge>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="text-yellow-600" size={20} />
              <div className="flex-1">
                <p className="font-medium text-sm">Payment Required</p>
                <p className="text-xs text-gray-500">Sent to 5 users - 6 hours ago</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">warning</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationManagement;

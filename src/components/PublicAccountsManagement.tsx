
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PublicUserPasswordForm } from './forms/PublicUserPasswordForm';
import { PublicUserForm } from './public-accounts/PublicUserForm';
import { apiService, type PublicUser } from '@/services/apiService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Edit, Trash2, UserPlus, Download } from 'lucide-react';
import { EnhancedIDCardPrinter } from './id-card/EnhancedIDCardPrinter';

export function PublicAccountsManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await apiService.getPublicUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch public users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      setIsLoading(true);
      const newUser = await apiService.createPublicUser(userData);
      setUsers(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return [newUser, ...safePrev];
      });
      setShowForm(false);
      toast({
        title: "Success",
        description: "Public user created successfully with QR code",
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create public user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (userData: any) => {
    try {
      setIsLoading(true);
      const updatedUser = await apiService.updatePublicUser(userData.id, userData);
      setUsers(prev => prev.map(user => user.id === userData.id ? updatedUser : user));
      setShowForm(false);
      setSelectedUser(null);
      toast({
        title: "Success",
        description: "Public user updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update public user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: PublicUser) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleView = (user: PublicUser) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      setIsLoading(true);
      await apiService.deletePublicUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
      toast({
        title: "Success",
        description: "Public user deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete public user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = (user: PublicUser) => {
    setSelectedUser(user);
    setShowPasswordForm(true);
  };

  const handlePrintIDCard = async (user: PublicUser) => {
    try {
      await EnhancedIDCardPrinter.printSingleCard(user, false, toast);
    } catch (error) {
      console.error('Error printing ID card:', error);
      toast({
        title: "Error",
        description: "Failed to generate ID card",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Public Users Management</h2>
        <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="mr-2" size={16} />
          Create New User
        </Button>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <PublicUserForm
          user={selectedUser}
          onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
          onClose={() => {
            setShowForm(false);
            setSelectedUser(null);
          }}
          isLoading={isLoading}
        />
      )}

      {/* Password Form Modal */}
      {showPasswordForm && selectedUser && (
        <Dialog open={showPasswordForm} onOpenChange={setShowPasswordForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Password for {selectedUser.name}</DialogTitle>
              <DialogDescription>
                Enter a new password for this user.
              </DialogDescription>
            </DialogHeader>
            <PublicUserPasswordForm
              userId={selectedUser.id}
              isStaffUpdate={true}
              onSuccess={() => setShowPasswordForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details - {selectedUser.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold">Public ID:</label>
                  <p>{selectedUser.public_id}</p>
                </div>
                <div>
                  <label className="font-semibold">Name:</label>
                  <p>{selectedUser.name}</p>
                </div>
                <div>
                  <label className="font-semibold">NIC:</label>
                  <p>{selectedUser.nic}</p>
                </div>
                <div>
                  <label className="font-semibold">Mobile:</label>
                  <p>{selectedUser.mobile || 'Not provided'}</p>
                </div>
                <div>
                  <label className="font-semibold">Email:</label>
                  <p>{selectedUser.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="font-semibold">Username:</label>
                  <p>{selectedUser.username || 'Not provided'}</p>
                </div>
                <div>
                  <label className="font-semibold">Department:</label>
                  <p>{selectedUser.department_name || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="font-semibold">Division:</label>
                  <p>{selectedUser.division_name || 'Not assigned'}</p>
                </div>
              </div>
              <div>
                <label className="font-semibold">Address:</label>
                <p>{selectedUser.address}</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleEdit(selectedUser)}>
                  Edit User
                </Button>
                <Button 
                  onClick={() => handlePrintIDCard(selectedUser)}
                  variant="outline"
                >
                  <Download className="mr-2" size={16} />
                  Print ID Card
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Public ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>NIC</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Division</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.public_id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.nic}</TableCell>
                <TableCell>{user.mobile || '-'}</TableCell>
                <TableCell>{user.email || '-'}</TableCell>
                <TableCell>{user.department_name || '-'}</TableCell>
                <TableCell>{user.division_name || '-'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(user)}
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(user)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePasswordUpdate(user)}
                  >
                    Set Password
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

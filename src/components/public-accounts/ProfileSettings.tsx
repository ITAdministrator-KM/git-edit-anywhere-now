
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicUserPasswordForm } from '../forms/PublicUserPasswordForm';
import { apiService, type PublicUser } from '@/services/apiService';
import { useToast } from '@/hooks/use-toast';

interface ProfileSettingsProps {
  user: PublicUser;
  onUpdate?: () => void;
}

export function ProfileSettings({ user, onUpdate }: ProfileSettingsProps) {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>View and manage your profile settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Public ID</label>
              <p className="text-sm text-gray-500">{user.public_id}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="text-sm text-gray-500">{user.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">NIC</label>
              <p className="text-sm text-gray-500">{user.nic}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Mobile</label>
              <p className="text-sm text-gray-500">{user.mobile || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-gray-500">{user.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <p className="text-sm text-gray-500">{user.username || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your login password</CardDescription>
        </CardHeader>
        <CardContent>
          <PublicUserPasswordForm 
            userId={user.id} 
            isStaffUpdate={false}
            onSuccess={() => {
              toast({
                title: "Success",
                description: "Password updated successfully",
              });
              if (onUpdate) onUpdate();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

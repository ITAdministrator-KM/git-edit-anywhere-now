
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Printer, Download } from 'lucide-react';
import type { PublicUser } from '@/services/apiService';
import { IDCardValidator } from './IDCardValidator';

interface UserCardListProps {
  users: PublicUser[];
  selectedUsers: number[];
  onSelectUser: (userId: number) => void;
  onSinglePrint: (user: PublicUser) => void;
  isLoading: boolean;
  autoPrint: boolean;
}

export const UserCardList = ({
  users,
  selectedUsers,
  onSelectUser,
  onSinglePrint,
  isLoading,
  autoPrint
}: UserCardListProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {users.map(user => (
        <Card key={user.id} className="relative">
          <CardContent className="p-4">
            <div className="absolute top-4 right-4">
              <Checkbox
                checked={selectedUsers.includes(user.id)}
                onCheckedChange={() => onSelectUser(user.id)}
              />
            </div>
            <div className="pr-8 space-y-2">
              <h3 className="font-medium">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.public_id}</p>
              <p className="text-sm text-muted-foreground">{user.nic}</p>
              {!IDCardValidator.validateQRCode(user.qr_code || '') && (
                <div className="flex items-center text-amber-600">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  <span className="text-xs">QR Code Issue</span>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSinglePrint(user)}
                className="w-full mt-2"
                disabled={isLoading}
              >
                {autoPrint ? <Printer className="mr-2 h-3 w-3" /> : <Download className="mr-2 h-3 w-3" />}
                {autoPrint ? 'Print' : 'Generate'} Single
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

import { memo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, UserPlus, Trash2, Plus } from 'lucide-react';
import { Profile, UserActivity } from '@/lib/types';
import { type FilterOptions, type PaginationOptions } from '@/lib/utils/data';
import { formatDateShort, isDateWithinLastDays } from '@/lib/utils/date';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

interface DashboardUsersTabProps {
  userActivity: UserActivity[];
  profiles: Profile[];
  usersFilter: FilterOptions;
  usersPagination: PaginationOptions;
  setUsersFilter: (filter: FilterOptions) => void;
  setUsersPagination: (pagination: PaginationOptions) => void;
  handleAddUser: () => Promise<void>;
  handleRemoveUser: () => Promise<void>;
  dataLoading: boolean;
  isAddingUser: boolean;
  isAddUserModalOpen: boolean;
  setIsAddUserModalOpen: (open: boolean) => void;
  isRemoveUserModalOpen: boolean;
  setIsRemoveUserModalOpen: (open: boolean) => void;
  selectedUserForRemoval: UserActivity | null;
  setSelectedUserForRemoval: (user: UserActivity | null) => void;
  addUserForm: {
    email: string;
    fullName: string;
    graduationYear: string;
    userType: 'Alum' | 'Admin' | 'Staff';
    msc: boolean;
  };
  setAddUserForm: (form: DashboardUsersTabProps['addUserForm']) => void;
}

export const DashboardUsersTab = memo(function DashboardUsersTab({
  userActivity,
  profiles,
  usersFilter,
  usersPagination,
  setUsersFilter,
  setUsersPagination,
  handleAddUser,
  handleRemoveUser,
  dataLoading,
  isAddingUser,
  isAddUserModalOpen,
  setIsAddUserModalOpen,
  isRemoveUserModalOpen,
  setIsRemoveUserModalOpen,
  selectedUserForRemoval,
  setSelectedUserForRemoval,
  addUserForm,
  setAddUserForm,
}: DashboardUsersTabProps) {
  // Filter user activity for recent sign-ins (last 7 days)
  const recentSignIns = userActivity.filter(user => 
    user.lastSignInAt && isDateWithinLastDays(user.lastSignInAt, 7)
  );
  
  // Apply search filter
  const filteredUsers = usersFilter.search 
    ? recentSignIns.filter(user => 
        user.profile?.full_name?.toLowerCase().includes(usersFilter.search!.toLowerCase()) ||
        user.email.toLowerCase().includes(usersFilter.search!.toLowerCase())
      )
    : recentSignIns;
  
  // Sort by last sign-in
  const sortedUsers = filteredUsers.sort((a, b) => {
    const aDate = a.lastSignInAt || a.createdAt;
    const bDate = b.lastSignInAt || b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
  
  // Paginate
  const startIndex = (usersPagination.page - 1) * usersPagination.limit;
  const endIndex = startIndex + usersPagination.limit;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);
  const totalPages = Math.ceil(recentSignIns.length / usersPagination.limit);

  return (
    <div className="space-y-4">
      {/* Manage Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add User Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add User
            </CardTitle>
            <CardDescription>
              Create a new user account and profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" disabled={isAddingUser}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isAddingUser ? 'Creating...' : 'Add New User'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system. They will receive an email to set their password.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={addUserForm.fullName}
                      onChange={(e) => setAddUserForm({ ...addUserForm, fullName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="graduationYear">Graduation Year</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      value={addUserForm.graduationYear}
                      onChange={(e) => setAddUserForm({ ...addUserForm, graduationYear: e.target.value })}
                      placeholder="2023"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="userType">User Type</Label>
                    <select
                      id="userType"
                      value={addUserForm.userType}
                      onChange={(e) => setAddUserForm({ ...addUserForm, userType: e.target.value as 'Alum' | 'Admin' | 'Staff' })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="Alum">Alum</option>
                      <option value="Admin">Admin</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="msc"
                      type="checkbox"
                      checked={addUserForm.msc}
                      onChange={(e) => setAddUserForm({ ...addUserForm, msc: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="msc">MSC Program</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleAddUser} disabled={isAddingUser}>
                    {isAddingUser ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Remove User Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Remove User
            </CardTitle>
            <CardDescription>
              Remove a user account and their profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isRemoveUserModalOpen} onOpenChange={setIsRemoveUserModalOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Remove User</DialogTitle>
                  <DialogDescription>
                    Select a user to remove from the system. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="userSelect">Select User</Label>
                    <select
                      id="userSelect"
                      value={selectedUserForRemoval?.id || ''}
                      onChange={(e) => {
                        const user = userActivity.find(u => u.id === e.target.value);
                        setSelectedUserForRemoval(user || null);
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a user...</option>
                      {userActivity.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.profile?.full_name || user.email} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedUserForRemoval && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Warning:</strong> You are about to remove <strong>{selectedUserForRemoval.profile?.full_name || selectedUserForRemoval.email}</strong> from the system. This will permanently delete their account and all associated data.
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsRemoveUserModalOpen(false);
                      setSelectedUserForRemoval(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleRemoveUser}
                    disabled={!selectedUserForRemoval}
                  >
                    Remove User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sign-ins */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Sign-ins</CardTitle>
              <CardDescription>
                Users who have signed in within the last 7 days
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Search users..."
                value={usersFilter.search || ''}
                onChange={(e) => setUsersFilter({ ...usersFilter, search: e.target.value })}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ProfileAvatar
                      src={user.profile?.avatar_url}
                      fullName={user.profile?.full_name || user.email.split('@')[0]}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium">{user.profile?.full_name || user.email.split('@')[0]}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Last sign-in</p>
                    <p className="text-xs text-muted-foreground">
                      {user.lastSignInAt ? formatDateShort(user.lastSignInAt) : 'Never'}
                    </p>
                  </div>
                </div>
              ))}
              {recentSignIns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent sign-ins to display</p>
                </div>
              )}
              
              {/* Pagination */}
              {recentSignIns.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {usersPagination.page} of {totalPages} pages
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setUsersPagination({ ...usersPagination, page: Math.max(1, usersPagination.page - 1) })}
                      disabled={usersPagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setUsersPagination({ ...usersPagination, page: usersPagination.page + 1 })}
                      disabled={usersPagination.page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});


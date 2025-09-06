"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  HiUsers,
  HiUserCircle,
  HiShieldCheck,
  HiShieldExclamation,
  HiTrash,
  HiSearch,
  HiFilter,
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { adminApi, User } from "@/lib/api";

type UserRole = "ADMIN" | "USER";
type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | "ALL">(
    "ALL"
  );

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (
      !confirm(
        `Are you sure you want to change this user's role to ${newRole}?`
      )
    ) {
      return;
    }

    try {
      await adminApi.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      await loadUsers();
    } catch (error: any) {
      console.error("Failed to update user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    if (
      !confirm(`Are you sure you want to ${newStatus.toLowerCase()} this user?`)
    ) {
      return;
    }

    try {
      await adminApi.updateUserStatus(userId, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      await loadUsers();
    } catch (error: any) {
      console.error("Failed to update user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role === "ADMIN") {
      toast.error("Cannot delete admin users");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${user.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteUser(user.id);
      toast.success("User deleted successfully");
      await loadUsers();
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone &&
        user.phone.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRole === "ALL" || user.role === selectedRole;
    const matchesStatus =
      selectedStatus === "ALL" || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getUserStats = () => {
    const totalUsers = users.length;
    const adminUsers = users.filter((u) => u.role === "ADMIN").length;
    const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
    const inactiveUsers = users.filter((u) => u.status === "INACTIVE").length;
    const suspendedUsers = users.filter((u) => u.status === "SUSPENDED").length;
    const deletedUsers = users.filter((u) => u.status === "DELETED").length;

    return {
      totalUsers,
      adminUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      deletedUsers,
    };
  };

  const stats = getUserStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Users Management
          </h1>
          <p className="text-foreground-secondary">
            Manage user accounts, roles, and permissions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Total Users
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalUsers}
                </p>
              </div>
              <HiUsers className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Admin Users
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.adminUsers}
                </p>
              </div>
              <HiShieldCheck className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Active Users
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.activeUsers}
                </p>
              </div>
              <HiUserCircle className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Inactive Users
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.inactiveUsers}
                </p>
              </div>
              <HiUserCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Suspended
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.suspendedUsers}
                </p>
              </div>
              <HiShieldExclamation className="w-8 h-8 text-error" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Deleted
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.deletedUsers}
                </p>
              </div>
              <HiTrash className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HiFilter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRole(e.target.value as UserRole | "ALL")
                }
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">User</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as UserStatus | "ALL")
                }
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DELETED">Deleted</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Contact</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Joined</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border hover:bg-background-secondary"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-foreground-secondary">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="text-sm">{user.email}</div>
                        {user.phone && (
                          <div className="text-sm text-foreground-secondary">
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as UserRole)
                        }
                        className={`px-2 py-1 rounded-full text-xs font-medium border-none focus:ring-0 ${
                          user.role === "ADMIN"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={user.status}
                        onChange={(e) =>
                          handleStatusChange(
                            user.id,
                            e.target.value as UserStatus
                          )
                        }
                        className={`px-2 py-1 rounded-full text-xs font-medium border-none focus:ring-0 ${
                          user.status === "ACTIVE"
                            ? "bg-secondary/10 text-secondary"
                            : user.status === "INACTIVE"
                            ? "bg-orange-500/10 text-orange-500"
                            : user.status === "SUSPENDED"
                            ? "bg-error/10 text-error"
                            : user.status === "DELETED"
                            ? "bg-gray-500/10 text-gray-500"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="DELETED">Deleted</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-foreground-secondary">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {user.role !== "ADMIN" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:bg-error/10"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <HiTrash className="w-4 h-4" />
                          </Button>
                        )}
                        {user.role === "ADMIN" && (
                          <span className="text-xs text-foreground-muted px-2">
                            Protected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-foreground-secondary">
                No users found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

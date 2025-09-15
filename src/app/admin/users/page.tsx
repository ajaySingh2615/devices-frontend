"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  HiUsers,
  HiUserCircle,
  HiShieldCheck,
  HiShieldExclamation,
  HiTrash,
  HiSearch,
  HiFilter,
  HiRefresh,
  HiChevronLeft,
  HiChevronRight,
  HiDownload,
  HiClipboardCopy,
  HiCheck,
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { adminApi, User } from "@/lib/api";

type UserRole = "ADMIN" | "USER";
type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | "ALL">(
    "ALL"
  );

  // sorting
  const [sortKey, setSortKey] = useState<
    "newest" | "oldest" | "name_asc" | "name_desc"
  >("newest");

  // selection & bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    loadUsers();
  }, []);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllUsers();
      setUsers(data);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- derived data ---------- */

  const stats = useMemo(() => {
    const total = users.length;
    const adminUsers = users.filter((u) => u.role === "ADMIN").length;
    const active = users.filter((u) => u.status === "ACTIVE").length;
    const inactive = users.filter((u) => u.status === "INACTIVE").length;
    const suspended = users.filter((u) => u.status === "SUSPENDED").length;
    const deleted = users.filter((u) => u.status === "DELETED").length;
    return { total, adminUsers, active, inactive, suspended, deleted };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let list = users.filter((u) => {
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        u.id.toLowerCase().includes(q);
      const matchesRole = selectedRole === "ALL" || u.role === selectedRole;
      const matchesStatus =
        selectedStatus === "ALL" || u.status === selectedStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });

    // sort
    list.sort((a, b) => {
      if (sortKey === "newest") {
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      }
      if (sortKey === "oldest") {
        return (
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
        );
      }
      if (sortKey === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortKey === "name_desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      return 0;
    });

    return list;
  }, [users, searchQuery, selectedRole, selectedStatus, sortKey]);

  // pagination slices
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const allVisibleSelected =
    paginated.length > 0 && paginated.every((u) => selectedIds.has(u.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAllVisible = () => {
    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      paginated.forEach((u) => next.delete(u.id));
    } else {
      paginated.forEach((u) => next.add(u.id));
    }
    setSelectedIds(next);
  };

  const isLastAdmin = (user: User) => {
    return user.role === "ADMIN" && stats.adminUsers <= 1;
  };

  /* ---------- actions ---------- */

  const handleRoleChange = async (user: User, newRole: UserRole) => {
    if (user.role === newRole) return;

    if (isLastAdmin(user) && newRole !== "ADMIN") {
      toast.error("Cannot remove the last admin.");
      return;
    }
    if (!confirm(`Change role for ${user.name || user.email} to ${newRole}?`)) {
      return;
    }
    try {
      await adminApi.updateUserRole(user.id, newRole);
      toast.success(`Role updated to ${newRole}`);
      await loadUsers();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user role");
    }
  };

  const handleStatusChange = async (user: User, newStatus: UserStatus) => {
    if (user.status === newStatus) return;

    if (
      isLastAdmin(user) &&
      (newStatus === "SUSPENDED" ||
        newStatus === "DELETED" ||
        newStatus === "INACTIVE")
    ) {
      toast.error("Cannot disable/suspend/delete the last admin.");
      return;
    }
    if (!confirm(`Set ${user.name || user.email} status to ${newStatus}?`)) {
      return;
    }
    try {
      await adminApi.updateUserStatus(user.id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      await loadUsers();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role === "ADMIN") {
      toast.error("Cannot delete admin users");
      return;
    }
    if (!confirm(`Delete ${user.name || user.email}? This cannot be undone.`)) {
      return;
    }
    try {
      await adminApi.deleteUser(user.id);
      toast.success("User deleted");
      await loadUsers();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete user");
    }
  };

  const bulkSetStatus = async (status: UserStatus) => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Set status "${status}" for ${selectedIds.size} selected user(s)?`
      )
    )
      return;

    try {
      for (const id of selectedIds) {
        const u = users.find((x) => x.id === id);
        if (!u) continue;
        if (
          u.role === "ADMIN" &&
          (status === "SUSPENDED" ||
            status === "DELETED" ||
            status === "INACTIVE") &&
          isLastAdmin(u)
        ) {
          toast.error(`Skipped ${u.email || u.name}: last admin`);
          continue;
        }
        try {
          await adminApi.updateUserStatus(id, status);
        } catch (e) {
          console.error("Failed to update", id, e);
        }
      }
      toast.success("Bulk status update complete");
      setSelectedIds(new Set());
      await loadUsers();
    } catch (e) {
      console.error(e);
      toast.error("Bulk update failed");
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Delete ${selectedIds.size} selected user(s)? This cannot be undone.`
      )
    )
      return;

    try {
      for (const id of selectedIds) {
        const u = users.find((x) => x.id === id);
        if (!u) continue;
        if (u.role === "ADMIN") {
          toast.error(`Skipped ${u.email || u.name}: admin`);
          continue;
        }
        try {
          await adminApi.deleteUser(id);
        } catch (e) {
          console.error("Failed to delete", id, e);
        }
      }
      toast.success("Bulk delete complete");
      setSelectedIds(new Set());
      await loadUsers();
    } catch (e) {
      console.error(e);
      toast.error("Bulk delete failed");
    }
  };

  const exportCsv = () => {
    const rows = [
      ["ID", "Name", "Email", "Phone", "Role", "Status", "Joined"],
      ...filteredUsers.map((u) => [
        u.id,
        u.name || "",
        u.email || "",
        u.phone || "",
        u.role,
        u.status,
        u.createdAt ? new Date(u.createdAt).toISOString() : "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Role",
      "Status",
      "Joined",
    ];
    const rows = filteredUsers.map((u) => ({
      ID: u.id,
      Name: u.name || "",
      Email: u.email || "",
      Phone: u.phone || "",
      Role: u.role,
      Status: u.status,
      Joined: u.createdAt ? new Date(u.createdAt).toISOString() : "",
    }));

    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- render ---------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Users Management
          </h1>
          <p className="text-sm text-foreground-muted">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadUsers}>
            <HiRefresh className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <HiDownload className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportExcel}>
            <HiDownload className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <StatCard
          label="Total Users"
          value={stats.total}
          icon={<HiUsers className="w-6 h-6 text-primary" />}
        />
        <StatCard
          label="Admin Users"
          value={stats.adminUsers}
          icon={<HiShieldCheck className="w-6 h-6 text-secondary" />}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<HiUserCircle className="w-6 h-6 text-accent" />}
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          icon={<HiUserCircle className="w-6 h-6 text-orange-500" />}
        />
        <StatCard
          label="Suspended"
          value={stats.suspended}
          icon={<HiShieldExclamation className="w-6 h-6 text-error" />}
        />
        <StatCard
          label="Deleted"
          value={stats.deleted}
          icon={<HiTrash className="w-6 h-6 text-foreground-light" />}
        />
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <CardTitle className="flex items-center">
            <HiFilter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-light w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by name, email, phone, or ID…"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as UserRole | "ALL");
                  setPage(0);
                }}
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
                onChange={(e) => {
                  setSelectedStatus(e.target.value as UserStatus | "ALL");
                  setPage(0);
                }}
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DELETED">Deleted</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sort</label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as any)}
                className="w-full p-3 border border-border rounded-lg bg-surface"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name_asc">Name A→Z</option>
                <option value="name_desc">Name Z→A</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions + pagination controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSelectAllVisible}
            disabled={paginated.length === 0}
          >
            <HiCheck className="w-4 h-4 mr-2" />
            {allVisibleSelected
              ? "Unselect All (Visible)"
              : "Select All (Visible)"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!someSelected}
            onClick={() => bulkSetStatus("SUSPENDED")}
            className={someSelected ? "text-error hover:text-error" : ""}
          >
            Suspend Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!someSelected}
            onClick={() => bulkSetStatus("ACTIVE")}
          >
            Activate Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!someSelected}
            onClick={bulkDelete}
            className={someSelected ? "text-error hover:text-error" : ""}
          >
            Delete Selected
          </Button>
          {someSelected && (
            <span className="text-sm text-foreground-secondary">
              {selectedIds.size} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value));
              setPage(0);
            }}
            className="px-3 py-2 rounded-md border border-border bg-background"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
          <div className="text-sm text-foreground-secondary">
            Page {currentPage + 1} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            <HiChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            <HiChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-surface z-10">
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium w-10"></th>
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Contact</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Joined</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border hover:bg-background-secondary"
                  >
                    {/* select */}
                    <td className="py-3 px-4 align-middle">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border"
                        checked={selectedIds.has(user.id)}
                        onChange={() => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(user.id)) next.delete(user.id);
                            else next.add(user.id);
                            return next;
                          });
                        }}
                        aria-label="Select row"
                      />
                    </td>

                    {/* user info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                          <span className="font-medium text-sm">
                            {(user.name || user.email || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {user.name || "—"}
                          </div>
                          <div className="text-[12px] text-foreground-secondary flex items-center gap-2">
                            <span className="truncate">ID: {user.id}</span>
                            <button
                              className="p-1 rounded hover:bg-background-tertiary"
                              title="Copy ID"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(user.id);
                                  toast.success("User ID copied");
                                } catch {
                                  toast.error("Failed to copy");
                                }
                              }}
                            >
                              <HiClipboardCopy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* contact */}
                    <td className="py-3 px-4">
                      <div className="text-sm">{user.email || "—"}</div>
                      <div className="text-sm text-foreground-secondary">
                        {user.phone || "—"}
                      </div>
                    </td>

                    {/* role */}
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user, e.target.value as UserRole)
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

                    {/* status */}
                    <td className="py-3 px-4">
                      <select
                        value={user.status}
                        onChange={(e) =>
                          handleStatusChange(user, e.target.value as UserStatus)
                        }
                        className={`px-2 py-1 rounded-full text-xs font-medium border-none focus:ring-0 ${
                          user.status === "ACTIVE"
                            ? "bg-secondary/10 text-secondary"
                            : user.status === "INACTIVE"
                            ? "bg-orange-500/10 text-orange-500"
                            : user.status === "SUSPENDED"
                            ? "bg-error/10 text-error"
                            : "bg-gray-500/10 text-gray-600"
                        }`}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="DELETED">Deleted</option>
                      </select>
                    </td>

                    {/* joined */}
                    <td className="py-3 px-4 text-sm text-foreground-secondary">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })
                        : "N/A"}
                    </td>

                    {/* actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {user.role !== "ADMIN" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:bg-error/10"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <HiTrash className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Badge className="bg-background-tertiary text-foreground-secondary border border-border">
                            Protected
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginated.length === 0 && (
              <div className="py-10 text-center text-foreground-secondary">
                No users found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- small bits ---------------- */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-surface border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] uppercase tracking-wider text-foreground-light">
              {label}
            </div>
            <div className="mt-1 text-xl font-bold text-foreground">
              {value}
            </div>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, clearTokens } from "@/lib/auth";
import { getUsers, updateUser, deleteUser } from "@/lib/api";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users, LogOut, Shield, User, Calendar, Pencil, Trash2,
  X, Check, AlertTriangle, LayoutDashboard,
} from "lucide-react";

interface UserRow {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

interface EditState {
  id: number;
  username: string;
  role: string;
  password: string;
}

export default function WelcomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editState, setEditState] = useState<EditState | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [tableError, setTableError] = useState("");
  const [tableSuccess, setTableSuccess] = useState("");

  // Auth guard
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    setCurrentUser(user);
  }, [router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setError("Failed to load users. Please check your session.");
      }
    } catch {
      setError("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) fetchUsers();
  }, [currentUser, fetchUsers]);

  function handleLogout() {
    clearTokens();
    router.replace("/login");
  }

  function startEdit(user: UserRow) {
    setEditState({ id: user.id, username: user.username, role: user.role, password: "" });
    setTableError("");
    setTableSuccess("");
    setConfirmDeleteId(null);
  }

  function cancelEdit() {
    setEditState(null);
    setTableError("");
  }

  async function handleSave() {
    if (!editState) return;
    if (!editState.username.trim()) {
      setTableError("Username cannot be empty.");
      return;
    }
    setSavingId(editState.id);
    setTableError("");
    setTableSuccess("");
    try {
      const payload: { username?: string; password?: string; role?: string } = {
        username: editState.username.trim(),
        role: editState.role,
      };
      if (editState.password) payload.password = editState.password;
      const updated = await updateUser(editState.id, payload);
      if (updated && updated.id) {
        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
        );
        setTableSuccess(`User "${updated.username}" updated successfully.`);
        setEditState(null);
      } else {
        setTableError(updated.message || "Update failed.");
      }
    } catch {
      setTableError("Could not update user.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setEditState(null);
      return;
    }
    setDeletingId(id);
    setTableError("");
    setTableSuccess("");
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTableSuccess("User deleted successfully.");
      setConfirmDeleteId(null);
    } catch {
      setTableError("Could not delete user.");
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  }

  if (!currentUser) return null;

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role === "user").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Nav */}
      <header className="border-b border-slate-700 bg-slate-800/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-white text-lg">ACT Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-white font-medium">{currentUser.username}</p>
              <p className="text-xs text-slate-400 capitalize">{currentUser.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}
              className="border-slate-600 text-slate-200 hover:bg-slate-700">
              <LogOut className="w-4 h-4 mr-1.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-700 to-slate-600 p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-slate-300 text-sm mb-1">Welcome back,</p>
            <h1 className="text-3xl font-bold text-white">
              {currentUser.username} 👋
            </h1>
            <p className="text-slate-400 mt-1 text-sm capitalize">
              Role: <span className="text-slate-200 font-medium">{currentUser.role}</span>
            </p>
          </div>
          <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/10 items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Total Users</p>
                <p className="text-2xl font-bold text-white">{loading ? "—" : totalUsers}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Admins</p>
                <p className="text-2xl font-bold text-white">{loading ? "—" : adminCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <User className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Regular Users</p>
                <p className="text-2xl font-bold text-white">{loading ? "—" : userCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="bg-slate-800/60 border-slate-700">
          <CardHeader className="border-b border-slate-700 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" /> Users Management
                </CardTitle>
                <CardDescription className="text-slate-400 mt-1">
                  View, edit, and delete users from the system
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                disabled={loading}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                ) : "↺ Refresh"}
              </Button>
            </div>

            {/* Table messages */}
            {tableError && (
              <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {tableError}
              </div>
            )}
            {tableSuccess && (
              <div className="mt-3 rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2 text-sm text-green-400 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" /> {tableSuccess}
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {error ? (
              <div className="p-8 text-center text-red-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-70" />
                {error}
              </div>
            ) : loading ? (
              <div className="p-10 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-slate-500 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="p-10 text-center text-slate-400">No users found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400 w-12">ID</TableHead>
                    <TableHead className="text-slate-400">Username</TableHead>
                    <TableHead className="text-slate-400">Role</TableHead>
                    <TableHead className="text-slate-400">New Password</TableHead>
                    <TableHead className="text-slate-400 hidden sm:table-cell">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined</span>
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isEditing = editState?.id === user.id;
                    const isConfirmDelete = confirmDeleteId === user.id;

                    return (
                      <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/30 transition-colors">
                        {/* ID */}
                        <TableCell className="text-slate-500 font-mono text-xs">#{user.id}</TableCell>

                        {/* Username */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editState.username}
                              onChange={(e) =>
                                setEditState((s) => s ? { ...s, username: e.target.value } : s)
                              }
                              className="h-7 text-sm bg-slate-700 border-slate-500 text-white w-36"
                            />
                          ) : (
                            <span className="text-white font-medium">{user.username}</span>
                          )}
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          {isEditing ? (
                            <select
                              value={editState.role}
                              onChange={(e) =>
                                setEditState((s) => s ? { ...s, role: e.target.value } : s)
                              }
                              className="h-7 rounded-lg border border-slate-500 bg-slate-700 text-white text-sm px-2 outline-none focus:border-primary"
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "bg-slate-600/50 text-slate-300 border border-slate-500/30"
                            }`}>
                              {user.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                              {user.role}
                            </span>
                          )}
                        </TableCell>

                        {/* New Password (edit only) */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="password"
                              placeholder="Leave blank to keep"
                              value={editState.password}
                              onChange={(e) =>
                                setEditState((s) => s ? { ...s, password: e.target.value } : s)
                              }
                              className="h-7 text-sm bg-slate-700 border-slate-500 text-white w-36"
                            />
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </TableCell>

                        {/* Joined */}
                        <TableCell className="text-slate-400 text-xs hidden sm:table-cell">
                          {formatDate(user.created_at)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEdit}
                                className="h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={savingId === user.id}
                                className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white"
                              >
                                {savingId === user.id ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </div>
                          ) : isConfirmDelete ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-xs text-red-400">Confirm?</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmDeleteId(null)}
                                className="h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDelete(user.id)}
                                disabled={deletingId === user.id}
                                className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white"
                              >
                                {deletingId === user.id ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(user)}
                                className="h-7 px-2 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(user.id)}
                                className="h-7 px-2 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/40 hover:text-red-300"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

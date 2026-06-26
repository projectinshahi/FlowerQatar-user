"use client";

import { useState, useEffect } from 'react';
import { Users, Search, Edit2, Loader2, Check, X, ShieldAlert, Trash2 } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ role: '', isActive: true });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (user: any) => {
    setEditingId(user.id);
    setEditForm({
      role: user.role,
      isActive: user.isActive,
    });
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editForm.role,
          isActive: editForm.isActive
        })
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, role: editForm.role, isActive: editForm.isActive } : u));
        setEditingId(null);
      } else {
        alert('Failed to update user.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to completely delete ${name}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        alert('Failed to delete user.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Manage Users</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search users..." 
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">User</th>
                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users size={48} className="text-gray-200 mb-4" />
                      <p>No users found in the system.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Unnamed User'}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Role Column */}
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <select 
                          value={editForm.role}
                          onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'ADMIN' ? 'bg-primary/10 text-primary' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && <ShieldAlert size={12} />}
                          {user.role}
                        </span>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <select 
                          value={editForm.isActive ? 'true' : 'false'}
                          onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'true'})}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="true">Active</option>
                          <option value="false">Suspended</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      )}
                    </td>

                    {/* Joined Column */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right">
                      {editingId === user.id ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleSave(user.id)}
                            disabled={isSaving}
                            className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                            title="Save"
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            disabled={isSaving}
                            className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEditClick(user)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all inline-flex items-center justify-center"
                            title="Edit User"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id, user.email)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all inline-flex items-center justify-center"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { User } from "@/types/firebase";

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (user: Partial<User>) => Promise<void>;
  initialData?: Partial<User>;
  mode: "add" | "edit";
  role: "student" | "teacher";
}

const defaultStudent: Partial<User> = {
  name: "",
  email: "",
  identificationNumber: "",
  phoneNumber: "",
  department: "",
  courses: [],
  accountStatus: "active",
};

const defaultTeacher: Partial<User> = {
  name: "",
  email: "",
  identificationNumber: "",
  phoneNumber: "",
  department: "",
  accountStatus: "active",
};

export default function UserModal({ open, onClose, onSave, initialData, mode, role }: UserModalProps) {
  const [form, setForm] = useState<Partial<User>>(role === "student" ? defaultStudent : defaultTeacher);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initialData || (role === "student" ? defaultStudent : defaultTeacher));
      setError("");
    }
  }, [open, initialData, role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "add" ? `Add ${role.charAt(0).toUpperCase() + role.slice(1)}` : `Edit ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input name="name" value={form.name || ""} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" value={form.email || ""} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
            <input name="identificationNumber" value={form.identificationNumber || ""} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input name="phoneNumber" value={form.phoneNumber || ""} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input name="department" value={form.department || ""} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          {role === "student" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Courses (comma separated)</label>
              <input name="courses" value={Array.isArray(form.courses) ? form.courses.join(", ") : ""} onChange={e => setForm(prev => ({ ...prev, courses: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
            <select name="accountStatus" value={form.accountStatus || "active"} onChange={handleSelectChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              {loading ? (mode === "add" ? "Adding..." : "Saving...") : (mode === "add" ? "Add" : "Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

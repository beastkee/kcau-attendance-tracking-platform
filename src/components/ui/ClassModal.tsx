"use client";

import React, { useState, useEffect } from "react";
import { Course } from "@/types";
import { User } from "@/types/firebase";

interface ClassModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (course: Partial<Course>) => Promise<void>;
  initialData?: Partial<Course>;
  mode: "add" | "edit";
  teachers: User[]; // List of available teachers
}

const defaultClass: Partial<Course> = {
  name: "",
  code: "",
  teacherId: "",
  studentIds: [],
  schedule: "",
  department: "",
  semester: "",
  credits: 0,
  description: "",
};

export default function ClassModal({ open, onClose, onSave, initialData, mode, teachers }: ClassModalProps) {
  const [form, setForm] = useState<Partial<Course>>(defaultClass);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initialData || defaultClass);
      setError("");
    }
  }, [open, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save class");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "add" ? "Add Class" : "Edit Class"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
              <input name="code" value={form.code || ""} onChange={handleChange} required placeholder="e.g., CS101" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
              <input name="credits" type="number" value={form.credits || ""} onChange={handleNumberChange} placeholder="e.g., 3" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
            <input name="name" value={form.name || ""} onChange={handleChange} required placeholder="e.g., Introduction to Computer Science" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher *</label>
            <select name="teacherId" value={form.teacherId || ""} onChange={handleSelectChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900">
              <option value="">Select a teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input name="department" value={form.department || ""} onChange={handleChange} placeholder="e.g., Computer Science" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <input name="semester" value={form.semester || ""} onChange={handleChange} placeholder="e.g., Fall 2025" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
            <input name="schedule" value={form.schedule || ""} onChange={handleChange} placeholder="e.g., Mon/Wed/Fri 9:00 AM - 10:30 AM" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description || ""} onChange={handleChange} rows={3} placeholder="Brief description of the course..." className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" />
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
              {loading ? (mode === "add" ? "Creating..." : "Saving...") : (mode === "add" ? "Create Class" : "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

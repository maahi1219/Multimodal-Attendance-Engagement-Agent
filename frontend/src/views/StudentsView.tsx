import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  X,
  FileSpreadsheet,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { Student, StudentDetailResponse } from '../types';
import { api } from '../api';

interface StudentsViewProps {
  selectedClass: string;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ selectedClass }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState(selectedClass || '');
  const [filterDept, setFilterDept] = useState('');
  const [classesList, setClassesList] = useState<string[]>([]);
  const [deptList, setDeptList] = useState<string[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentDetailResponse | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    class_name: 'CS-301 Computer Networks',
    department: 'Computer Science & Engineering',
    enrollment_year: 2024,
    consent_status: true,
    avatar_url: ''
  });

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents(
        search || undefined,
        filterClass || undefined,
        filterDept || undefined
      );
      setStudents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getClassesAndDepartments().then(({ classes, departments }) => {
      setClassesList(classes);
      setDeptList(departments);
    });
  }, []);

  useEffect(() => {
    loadStudents();
  }, [search, filterClass, filterDept]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, formData);
      } else {
        await api.createStudent({
          ...formData,
          student_id: formData.student_id || `STU-2026-${Math.floor(100 + Math.random() * 900)}`,
          avatar_url: formData.avatar_url || `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150`
        });
      }
      setShowAddModal(false);
      setEditingStudent(null);
      resetForm();
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Error saving student');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this student record?')) return;
    try {
      await api.deleteStudent(id);
      loadStudents();
      if (selectedStudentDetail?.student.id === id) {
        setSelectedStudentDetail(null);
      }
    } catch (err) {
      alert('Failed to delete student');
    }
  };

  const openStudentDetail = async (id: number) => {
    try {
      const detail = await api.getStudentDetail(id);
      setSelectedStudentDetail(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      class_name: student.class_name,
      department: student.department,
      enrollment_year: student.enrollment_year,
      consent_status: student.consent_status,
      avatar_url: student.avatar_url || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      name: '',
      email: '',
      class_name: classesList[0] || 'CS-301 Computer Networks',
      department: deptList[0] || 'Computer Science & Engineering',
      enrollment_year: 2024,
      consent_status: true,
      avatar_url: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Class Filter */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="">All Classes</option>
            {classesList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer hidden sm:block"
          >
            <option value="">All Departments</option>
            {deptList.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setEditingStudent(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-md shadow-indigo-600/30 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register Student</span>
        </button>
      </div>

      {/* Students Directory Grid/Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Registered Student Roster</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {students.length} Total
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Consent-Authorized Identification</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading student records...
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No students matched your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Student</th>
                  <th className="pb-3 font-semibold">Student ID</th>
                  <th className="pb-3 font-semibold">Enrolled Class</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold">Privacy Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={stu.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={stu.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-200">{stu.name}</div>
                          <div className="text-[11px] text-slate-400">{stu.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono font-medium text-slate-300">
                      {stu.student_id}
                    </td>
                    <td className="py-3 text-slate-300 font-medium">
                      {stu.class_name}
                    </td>
                    <td className="py-3 text-slate-400">
                      {stu.department}
                    </td>
                    <td className="py-3">
                      {stu.consent_status ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          Opt-In Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                          <XCircle className="w-3 h-3" />
                          Anonymous
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openStudentDetail(stu.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="View Attendance History"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(stu)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Edit Student"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(stu.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Attendance History Drawer / Modal */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudentDetail.student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={selectedStudentDetail.student.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedStudentDetail.student.name}
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-indigo-400">{selectedStudentDetail.student.student_id}</span>
                    <span>•</span>
                    <span>{selectedStudentDetail.student.class_name}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Attendance Summary Stat Cards */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-base font-bold text-white">{selectedStudentDetail.total_sessions}</div>
                <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-semibold">Total Sessions</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-base font-bold text-emerald-400">{selectedStudentDetail.attendance_percentage}%</div>
                <div className="text-[10px] text-emerald-300 uppercase mt-0.5 font-semibold">Attendance Rate</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-base font-bold text-amber-400">{selectedStudentDetail.late_count}</div>
                <div className="text-[10px] text-amber-300 uppercase mt-0.5 font-semibold">Late Marks</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="text-base font-bold text-rose-400">{selectedStudentDetail.absent_count}</div>
                <div className="text-[10px] text-rose-300 uppercase mt-0.5 font-semibold">Absences</div>
              </div>
            </div>

            {/* Session by Session Records */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Classroom Attendance History
              </h4>
              <div className="space-y-2">
                {selectedStudentDetail.history.map((h) => (
                  <div
                    key={h.record_id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{h.session_title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{h.session_code}</span>
                        <span>•</span>
                        <span>{h.date || 'N/A'}</span>
                      </div>
                      {h.verification_note && (
                        <div className="text-[10px] text-indigo-400 mt-1 italic">
                          Override: {h.verification_note}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono text-slate-300">{h.sustained_presence_duration} mins</div>
                        <div className="text-[10px] text-slate-400">{h.sustained_presence_ratio}% duration</div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          h.status === 'present'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : h.status === 'late'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateOrUpdate}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingStudent ? 'Edit Student Record' : 'Register New Student'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Hayes"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">University Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jordan.hayes@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Class / Course</label>
                <select
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {classesList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Student ID (Optional / Auto-generated)</label>
                <input
                  type="text"
                  placeholder="Leave blank to auto-generate STU-2026-XXX"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Consent for Attendance Tracking</div>
                  <div className="text-[11px] text-slate-400">Enrolls pseudonymized token for session verification</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.consent_status}
                  onChange={(e) => setFormData({ ...formData, consent_status: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30"
              >
                {editingStudent ? 'Save Changes' : 'Register Student'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

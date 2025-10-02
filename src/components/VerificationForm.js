// VerificationForm.js
import React, { useState } from 'react';

const initialState = {
  role: '',
  idNumber: '',
  course: '',
  yearLevel: '',
  department: '',
  position: '',
  studentName: '',
  relationship: '',
  proofFile: null,
  phone: '',
  notes: '',
};

function VerificationForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initialState);


  // Dynamic fields based on role
  const renderRoleFields = () => {
    switch (form.role) {
      case 'student-elementary':
        return (
          <>
            <div className="profile-field-fb">
              <label>Student ID Number (optional)</label>
              <input
                type="text"
                value={form.idNumber}
                onChange={e => setForm({ ...form, idNumber: e.target.value })}
              />
            </div>
            <div className="profile-field-fb">
              <label>Grade Level</label>
              <input
                type="text"
                value={form.yearLevel}
                onChange={e => setForm({ ...form, yearLevel: e.target.value })}
                required
                placeholder="e.g., Grade 1"
              />
            </div>
            <div className="profile-field-fb">
              <label>Section/Class</label>
              <input
                type="text"
                value={form.course}
                onChange={e => setForm({ ...form, course: e.target.value })}
                required
                placeholder="e.g., Section A"
              />
            </div>
          </>
        );
      case 'student-highschool':
        return (
          <>
            <div className="profile-field-fb">
              <label>Student ID Number</label>
              <input
                type="text"
                value={form.idNumber}
                onChange={e => setForm({ ...form, idNumber: e.target.value })}
                required
              />
            </div>
            <div className="profile-field-fb">
              <label>Grade Level</label>
              <input
                type="text"
                value={form.yearLevel}
                onChange={e => setForm({ ...form, yearLevel: e.target.value })}
                required
                placeholder="e.g., Grade 10"
              />
            </div>
            <div className="profile-field-fb">
              <label>Strand/Section</label>
              <input
                type="text"
                value={form.course}
                onChange={e => setForm({ ...form, course: e.target.value })}
                required
                placeholder="e.g., STEM, Section B"
              />
            </div>
          </>
        );
      case 'student-college':
        return (
          <>
            <div className="profile-field-fb">
              <label>Student ID Number</label>
              <input
                type="text"
                value={form.idNumber}
                onChange={e => setForm({ ...form, idNumber: e.target.value })}
                required
              />
            </div>
            <div className="profile-field-fb">
              <label>Course</label>
              <input
                type="text"
                value={form.course}
                onChange={e => setForm({ ...form, course: e.target.value })}
                required
              />
            </div>
            <div className="profile-field-fb">
              <label>Year Level</label>
              <input
                type="text"
                value={form.yearLevel}
                onChange={e => setForm({ ...form, yearLevel: e.target.value })}
                required
              />
            </div>
          </>
        );
      case 'teacher':
        return (
          <>
            <div className="profile-field-fb">
              <label>Department</label>
              <input
                type="text"
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                required
              />
            </div>
            <div className="profile-field-fb">
              <label>Position</label>
              <input
                type="text"
                value={form.position}
                onChange={e => setForm({ ...form, position: e.target.value })}
                required
              />
            </div>
          </>
        );
      case 'parent':
        return (
          <>
            <div className="profile-field-fb">
              <label>Student's Name</label>
              <input
                type="text"
                value={form.studentName}
                onChange={e => setForm({ ...form, studentName: e.target.value })}
                required
              />
            </div>
            <div className="profile-field-fb">
              <label>Relationship</label>
              <input
                type="text"
                value={form.relationship}
                onChange={e => setForm({ ...form, relationship: e.target.value })}
                required
              />
            </div>
          </>
        );
      case 'officer':
        return (
          <>
            <div className="profile-field-fb">
              <label>Office/Organization</label>
              <input
                type="text"
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                required
              />
            </div>
            <div className="profile-field-fb">
              <label>Position</label>
              <input
                type="text"
                value={form.position}
                onChange={e => setForm({ ...form, position: e.target.value })}
                required
              />
            </div>
          </>
        );
        case 'other':
        return (
          <>
            <div className="profile-field-fb">
            <label>Please specify your role</label>
            <input
              type="text"
              value={form.roleDescription}
              onChange={e => setForm({ ...form, roleDescription: e.target.value })}
              required
              placeholder="e.g., Alumni, Staff, Maintenance, Guest"
            />
          </div>
          </>
        );
      default:
        return (
          <div className="profile-field-fb">
            <label>ID Number</label>
            <input
              type="text"
              value={form.idNumber}
              onChange={e => setForm({ ...form, idNumber: e.target.value })}
              required
            />
          </div>
        );
    }
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="verification-form-fb" onSubmit={handleSubmit}>
      <h4 style={{color:'red', fontSize: 15, textAlign: 'center'}}>Make sure all the information are correct!</h4>
      <div className="profile-field-fb role-field-fb">
        <label>Role</label>
        <select
        value={form.role}
        onChange={e => setForm({ ...form, role: e.target.value })}
        required
        className="role-select-fb"
      >
        <option value="">Select Role</option>
        <option value="student-elementary">Student (Elementary)</option>
        <option value="student-highschool">Student (High School)</option>
        <option value="student-college">Student (College)</option>
        <option value="teacher">Teacher</option>
        <option value="parent">Parent/Guardian</option>
        <option value="officer">Officer</option>
        <option value="other">Other</option>
      </select>
      </div>
      {renderRoleFields()}
      <div className="profile-field-fb">
        <label>Additional Notes (optional)</label>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={2}
        />
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
        <button
          className="verify-btn-fb"
          type="submit"
          disabled={loading}
        >
          Submit
        </button>
      </div>
    </form>
  );
}

export default VerificationForm;
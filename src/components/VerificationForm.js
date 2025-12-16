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
              {/* <input
                type="text"
                value={form.yearLevel}
                onChange={e => setForm({ ...form, yearLevel: e.target.value })}
                required
                placeholder="e.g., Grade 1"
              /> */}
              <select
              value={form.yearLevel}
              onChange={e => setForm({ ...form, yearLevel: e.target.value })}
              className="role-select-fb"
              required
            >
              <option value="">Select Grade Level</option>
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
              <option value="3rd">3rd</option>
              <option value="4th">4th</option>
              <option value="5th">5th</option>
              <option value="6th">6th</option>
            </select>
            
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
              {/* <input
                type="text"
                value={form.yearLevel}
                onChange={e => setForm({ ...form, yearLevel: e.target.value })}
                required
                placeholder="e.g., Grade 10"
              /> */}
              <select
              value={form.yearLevel}
              onChange={e => setForm({ ...form, yearLevel: e.target.value })}
              className="role-select-fb"
              required
            >
              <option value="">Select Grade Level</option>
              <option value="7th">7th</option>
              <option value="8th">8th</option>
              <option value="9th">9th</option>
              <option value="10th">10th</option>
              <option value="11th">11th</option>
              <option value="12th">12th</option>
            </select>
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
              <select
              value={form.course}
              onChange={e => setForm({ ...form, course: e.target.value })}
              className="role-select-fb"
              required
            >
              <option value="">Select Course</option>
              <option value="BSIT">BSIT</option>
              <option value="BSHM">BSHM</option>
              <option value="BSENTREP">BSENTREP</option>
              <option value="BSED">BSED</option>
              <option value="BPED">BPED</option>
              <option value="BEED">BEED</option>
            </select>
            </div>
            <div className="profile-field-fb">
              <label>Year Level</label>
              {/* <input
                type="text"
                value={form.yearLevel}
                onChange={e => setForm({ ...form, yearLevel: e.target.value })}
                required
              /> */}
              <select
              value={form.yearLevel}
              onChange={e => setForm({ ...form, yearLevel: e.target.value })}
              className="role-select-fb"
              required
            >
              <option value="">Select Year Level</option>
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
              <option value="3rd">3rd</option>
              <option value="4th">4th</option>
            </select>
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
            {/* <div className="profile-field-fb">
              <label>Position</label>
              <input
                type="text"
                value={form.position}
                onChange={e => setForm({ ...form, position: e.target.value })}
                required
              />
            </div> */}
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
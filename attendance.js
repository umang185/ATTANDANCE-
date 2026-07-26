// System Seed State (Fallback if localStorage is clean)
const initialStaff = [
    { id: "1", name: "Alexander Vance", dept: "Engineering" },

];

// Core State Variables
let staffList = JSON.parse(localStorage.getItem('staffList')) || initialStaff;
let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || {};

// DOM Elements
let dateInput, tableBody, emptyState, addForm;

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM element references
    dateInput = document.getElementById('attendanceDate');
    tableBody = document.getElementById('attendanceTableBody');
    emptyState = document.getElementById('tableEmptyState');
    addForm = document.getElementById('addStaffForm');

    // Set default calendar date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Save initial seed structure if localStorage is fresh
    if (!localStorage.getItem('staffList')) {
        localStorage.setItem('staffList', JSON.stringify(staffList));
    }

    // Event Listeners
    dateInput.addEventListener('change', renderDashboard);
    addForm.addEventListener('submit', handleNewStaffSubmit);

    // Initial Render
    renderDashboard();
});

// Primary Render Engine
function renderDashboard() {
    const selectedDate = dateInput.value;
    tableBody.innerHTML = '';

    if (staffList.length === 0) {
        emptyState.style.display = 'block';
        updateMetrics(selectedDate);
        return;
    }
    emptyState.style.display = 'none';

    // Ensure date bucket initialization inside state
    if (!attendanceData[selectedDate]) {
        attendanceData[selectedDate] = {};
    }

    staffList.forEach(staff => {
        const currentStatus = attendanceData[selectedDate][staff.id] || 'Unmarked';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="staff-info">
                    <p>${escapeHtml(staff.name)}</p>
                    <span>${escapeHtml(staff.dept)}</span>
                </div>
            </td>
            <td>
                <div class="status-btn-group">
                    <button class="btn-status ${currentStatus === 'Present' ? 'active' : ''}" data-id="${staff.id}" data-status="Present">Present</button>
                    <button class="btn-status ${currentStatus === 'Late' ? 'active' : ''}" data-id="${staff.id}" data-status="Late">Late</button>
                    <button class="btn-status ${currentStatus === 'Absent' ? 'active' : ''}" data-id="${staff.id}" data-status="Absent">Absent</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    attachStatusButtonEvents();
    updateMetrics(selectedDate);
}

// Attach click handlers to dynamically generated status buttons
function attachStatusButtonEvents() {
    const selectedDate = dateInput.value;
    document.querySelectorAll('.btn-status').forEach(button => {
        button.addEventListener('click', (e) => {
            const staffId = e.target.getAttribute('data-id');
            const newStatus = e.target.getAttribute('data-status');
            
            // Toggle logic: clicking an already active status clears it
            if (attendanceData[selectedDate][staffId] === newStatus) {
                attendanceData[selectedDate][staffId] = 'Unmarked';
            } else {
                attendanceData[selectedDate][staffId] = newStatus;
            }

            localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
            renderDashboard();
        });
    });
}

// Calculate metrics based on the active date context
function updateMetrics(date) {
    const dayRecord = attendanceData[date] || {};
    let present = 0;
    let absent = 0;
    let late = 0;

    staffList.forEach(staff => {
        const status = dayRecord[staff.id];
        if (status === 'Present') present++;
        else if (status === 'Late') late++;
        else if (status === 'Absent') absent++;
    });

    const totalStaff = staffList.length;
    const attendedTotal = present + late; // Late counts toward general attendance presence
    const rate = totalStaff > 0 ? Math.round((attendedTotal / totalStaff) * 100) : 0;

    document.getElementById('statTotal').textContent = totalStaff;
    document.getElementById('statPresent').textContent = present + (late > 0 ? ` (+${late} Late)` : '');
    document.getElementById('statAbsent').textContent = absent;
    document.getElementById('statRate').textContent = `${rate}%`;
}

// Handle onboarding form logic
function handleNewStaffSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('staffName');
    const deptInput = document.getElementById('staffDept');

    const newStaff = {
        id: Date.now().toString(), // Generates a safe pseudo-unique string ID
        name: nameInput.value.trim(),
        dept: deptInput.value
    };

    staffList.push(newStaff);
    localStorage.setItem('staffList', JSON.stringify(staffList));

    // Form Reset
    nameInput.value = '';
    deptInput.value = '';

    renderDashboard();
}

// Protection Utility against basic XSS vectors
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


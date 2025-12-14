// Global variables to store data
let formData = {
    consentGiven: false,
    performance: {
        responseTime: '',
        pageLoadTime: '',
        errorRate: ''
    },
    satisfaction: {
        usabilityRating: 0,
        satisfactionRating: 0
    },
    demographic: {
        academicLevel: '',
        deviceType: ''
    },
    timestamp: '',
    sessionId: ''
};

// Initialize with random session ID
function initSession() {
    formData.sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
    formData.timestamp = new Date().toISOString();
    updatePreview();
}

// Toggle consent
function toggleConsent() {
    const checkbox = document.getElementById('consentCheckbox');
    const dataCollectionDiv = document.getElementById('dataCollection');
    const consentBtn = document.getElementById('consentBtn');
    
    if (checkbox.checked) {
        formData.consentGiven = true;
        dataCollectionDiv.classList.remove('hidden');
        consentBtn.textContent = '✓ Consent Granted';
        consentBtn.style.background = '#2ecc71';
        showStatus('Consent granted. You may now enter data.', 'success');
        initSession();
    } else {
        showStatus('Please check the consent box first.', 'warning');
    }
}

// Set rating values
function setRating(value, type) {
    const buttons = document.querySelectorAll(`.rating-btn[onclick*="${type}"]`);
    
    // Remove selected class from all buttons
    buttons.forEach(btn => btn.classList.remove('selected'));
    
    // Add selected class to clicked button
    event.target.classList.add('selected');
    
    // Store value
    if (type === 'usability') {
        formData.satisfaction.usabilityRating = value;
        document.getElementById('usabilityRating').textContent = value;
    } else if (type === 'satisfaction') {
        formData.satisfaction.satisfactionRating = value;
        document.getElementById('satisfactionRating').textContent = value;
    }
    
    updatePreview();
}

// Update form data from inputs
function updateFormData() {
    formData.performance.responseTime = document.getElementById('responseTime').value;
    formData.performance.pageLoadTime = document.getElementById('pageLoadTime').value;
    formData.performance.errorRate = document.getElementById('errorRate').value;
    formData.demographic.academicLevel = document.getElementById('academicLevel').value;
    formData.demographic.deviceType = document.getElementById('deviceType').value;
    
    updatePreview();
}

// Update data preview
function updatePreview() {
    document.getElementById('dataPreview').textContent = JSON.stringify(formData, null, 2);
}

// Validate form data
function validateData() {
    const errors = [];
    
    if (!formData.consentGiven) {
        errors.push('Consent not given');
    }
    
    if (!formData.performance.responseTime || formData.performance.responseTime < 0 || formData.performance.responseTime > 10000) {
        errors.push('Response time must be between 0-10000ms');
    }
    
    if (!formData.satisfaction.usabilityRating) {
        errors.push('Please rate system usability');
    }
    
    if (!formData.demographic.academicLevel) {
        errors.push('Please select academic level');
    }
    
    return errors;
}

// Submit data
function submitData() {
    // Update form data first
    updateFormData();
    
    // Validate
    const errors = validateData();
    
    if (errors.length > 0) {
        showStatus('Errors: ' + errors.join(', '), 'error');
        return;
    }
    
    // Simulate sending to backend (in real app, this would be fetch() to your API)
    const submissionData = {
        ...formData,
        submittedAt: new Date().toISOString()
    };
    
    // Store in localStorage (temporary storage)
    const submissions = JSON.parse(localStorage.getItem('lmsSubmissions') || '[]');
    submissions.push(submissionData);
    localStorage.setItem('lmsSubmissions', JSON.stringify(submissions));
    
    showStatus('✅ Data submitted successfully! Total submissions: ' + submissions.length, 'success');
    resetForm();
}

// Export data to CSV
function exportData() {
    const submissions = JSON.parse(localStorage.getItem('lmsSubmissions') || '[]');
    
    if (submissions.length === 0) {
        showStatus('No data to export. Please submit some data first.', 'warning');
        return;
    }
    
    // Create CSV content
    const headers = ['Session ID', 'Timestamp', 'Response Time', 'Page Load Time', 'Error Rate', 'Usability Rating', 'Satisfaction Rating', 'Academic Level', 'Device Type'];
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    submissions.forEach(sub => {
        const row = [
            sub.sessionId,
            sub.timestamp,
            sub.performance.responseTime,
            sub.performance.pageLoadTime,
            sub.performance.errorRate,
            sub.satisfaction.usabilityRating,
            sub.satisfaction.satisfactionRating,
            sub.demographic.academicLevel,
            sub.demographic.deviceType
        ];
        csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lms_research_data_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showStatus(`📥 Exported ${submissions.length} records to CSV`, 'success');
}

// Reset form
function resetForm() {
    document.getElementById('responseTime').value = '';
    document.getElementById('pageLoadTime').value = '';
    document.getElementById('errorRate').value = '';
    document.getElementById('academicLevel').value = '';
    document.getElementById('deviceType').value = '';
    
    // Reset rating buttons
    document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('usabilityRating').textContent = 'Not selected';
    document.getElementById('satisfactionRating').textContent = 'Not selected';
    
    // Reset form data (keep consent and session)
    formData.performance = { responseTime: '', pageLoadTime: '', errorRate: '' };
    formData.satisfaction = { usabilityRating: 0, satisfactionRating: 0 };
    formData.demographic = { academicLevel: '', deviceType: '' };
    formData.timestamp = new Date().toISOString();
    
    updatePreview();
    showStatus('Form reset. You can enter new data.', 'success');
}

// Show status messages
function showStatus(message, type = 'success') {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    statusDiv.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusDiv.classList.add('hidden');
    }, 5000);
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Update form data on input change
    document.getElementById('responseTime').addEventListener('input', updateFormData);
    document.getElementById('pageLoadTime').addEventListener('input', updateFormData);
    document.getElementById('errorRate').addEventListener('input', updateFormData);
    document.getElementById('academicLevel').addEventListener('change', updateFormData);
    document.getElementById('deviceType').addEventListener('change', updateFormData);
    
    // Show initial preview
    updatePreview();
    
    // Check for existing submissions
    const submissions = JSON.parse(localStorage.getItem('lmsSubmissions') || '[]');
    if (submissions.length > 0) {
        showStatus(`Welcome back! You have ${submissions.length} previous submissions.`, 'success');
    }
});
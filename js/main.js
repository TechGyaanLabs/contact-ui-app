
const idSearchEle = document.getElementById("idSearch");
const saveContactBtn = document.getElementById("saveContactBtn");
const addContactForm = document.getElementById("addContactForm");

const baseUrl = "https://contact-server-app-ty7k.onrender.com/api/v1/contacts";

// Global variables for edit functionality
let currentEditContact = null;
let isEditMode = false;

// Global variable for delete functionality
let contactToDelete = null;

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

function setupEventListeners() {
    // Save contact button event
    if (saveContactBtn) {
        saveContactBtn.addEventListener('click', handleSaveContact);
    }
    
    // Cancel button event
    const cancelBtn = document.querySelector('[data-bs-dismiss="modal"]');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancel);
    }
    
    // Modal close events
    const modal = document.getElementById('addContactModal');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', handleModalClose);
    }
    
    // Delete confirmation modal events
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
    }
    
    // Form validation on input
    const formInputs = addContactForm.querySelectorAll('input');
    formInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// Generic HTTP method for all API calls
async function makeHttpRequest(url, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow'
    };
    
    // Merge default options with provided options
    const requestOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, requestOptions);
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Try to parse as JSON, fallback to text if not JSON
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        return data;
    } catch (error) {
        console.error('HTTP Request Error:', error);
        throw error;
    }
}

idSearchEle.addEventListener("keyup", async (event) => {
        let str = event.target.value;
        try {
            if (str.trim() === "") {
                loadAllContacts();
                return;
            }
            let contacts = await seaarchContact(str);
            showContactsDetails(contacts);
        } catch (error) {
            console.error("Search Error: ", error);
        }
});

async function seaarchContact(str) {
    console.log("Search String: ", str);
    return await makeHttpRequest(`${baseUrl}/search?q=${str}`);
}

async function addContact(contact) {
    return await makeHttpRequest(baseUrl, {
        method: 'POST',
        body: JSON.stringify(contact)
    });
}


async function addContactDetails(){
    result = await addContact({
        "name": "Charan",
        "email": "charan@gmail.com",
        "mobile": "9988776655",
        "dob": "1995-08-15"
    });
    console.log("Add Contact Result: ", result);
}

//addContactDetails();

// Get all contacts without any filter
async function getContacts() {
    return await makeHttpRequest(baseUrl);
}

// Update an existing contact
async function updateContact(contact) {
    return await makeHttpRequest(`${baseUrl}/${contact.id}`, {
        method: 'PUT',
        body: JSON.stringify(contact)
    });
}

// Delete a contact by ID
async function deleteContact(id) {
    return await makeHttpRequest(`${baseUrl}/${id}`, {
        method: 'DELETE'
    });
}

// Handle save contact from modal (both add and edit)
async function handleSaveContact() {
    if (!validateForm()) {
        return;
    }
    
    const formData = getFormData();
    
    try {
        // Show loading state
        setButtonLoading(true);
        
        let result;
        if (isEditMode && currentEditContact) {
            // Update existing contact
            const updateData = { ...formData, id: currentEditContact.id };
            result = await updateContact(updateData);
            console.log("Contact updated successfully:", result);
            showAlert("Contact updated successfully!", "success");
        } else {
            // Add new contact
            result = await addContact(formData);
            console.log("Contact added successfully:", result);
            showAlert("Contact added successfully!", "success");
        }
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addContactModal'));
        modal.hide();
        resetForm();
        
        // Refresh the table
        loadAllContacts();
        
    } catch (error) {
        console.error("Error saving contact:", error);
        const action = isEditMode ? "updating" : "adding";
        showAlert(`Error ${action} contact. Please try again.`, "danger");
    } finally {
        setButtonLoading(false);
    }
}

// Get form data
function getFormData() {
    return {
        name: document.getElementById('contactName').value.trim(),
        email: document.getElementById('contactEmail').value.trim(),
        mobile: document.getElementById('contactMobile').value.trim(),
        dob: document.getElementById('contactDob').value
    };
}

// Validate entire form
function validateForm() {
    let isValid = true;
    
    // Validate name
    if (!validateField({ target: document.getElementById('contactName') })) {
        isValid = false;
    }
    
    // Validate email
    if (!validateField({ target: document.getElementById('contactEmail') })) {
        isValid = false;
    }
    
    // Validate mobile
    if (!validateField({ target: document.getElementById('contactMobile') })) {
        isValid = false;
    }
    
    // Validate DOB
    if (!validateField({ target: document.getElementById('contactDob') })) {
        isValid = false;
    }
    
    return isValid;
}

// Validate individual field
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';
    
    // Clear previous errors
    clearFieldError(event);
    
    switch (fieldName) {
        case 'name':
            if (value.length < 2) {
                errorMessage = 'Name must be at least 2 characters long';
                isValid = false;
            }
            break;
            
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errorMessage = 'Please enter a valid email address';
                isValid = false;
            }
            break;
            
        case 'mobile':
            const mobileRegex = /^[\+]?[1-9][\d]{0,15}$/;
            const cleanMobile = value.replace(/[\s\(\)\-]/g, '');
            if (!mobileRegex.test(cleanMobile)) {
                errorMessage = 'Please enter a valid mobile number';
                isValid = false;
            }
            break;
            
        case 'dob':
            if (!value) {
                errorMessage = 'Please select a date of birth';
                isValid = false;
            } else {
                const dobDate = new Date(value);
                const today = new Date();
                if (dobDate >= today) {
                    errorMessage = 'Date of birth must be in the past';
                    isValid = false;
                }
            }
            break;
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

// Show field error
function showFieldError(field, message) {
    field.classList.add('is-invalid');
    // Map field IDs to error element IDs
    const errorIdMap = {
        'contactName': 'nameError',
        'contactEmail': 'emailError',
        'contactMobile': 'mobileError',
        'contactDob': 'dobError'
    };
    
    const errorElementId = errorIdMap[field.id] || (field.id + 'Error');
    const errorElement = document.getElementById(errorElementId);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        console.error('Error element not found:', errorElementId);
    }
}

// Clear field error
function clearFieldError(event) {
    const field = event.target;
    field.classList.remove('is-invalid');
    
    // Map field IDs to error element IDs
    const errorIdMap = {
        'contactName': 'nameError',
        'contactEmail': 'emailError',
        'contactMobile': 'mobileError',
        'contactDob': 'dobError'
    };
    
    const errorElementId = errorIdMap[field.id] || (field.id + 'Error');
    const errorElement = document.getElementById(errorElementId);
    
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Reset form
function resetForm() {
    addContactForm.reset();
    const inputs = addContactForm.querySelectorAll('input');
    
    // Map field IDs to error element IDs
    const errorIdMap = {
        'contactName': 'nameError',
        'contactEmail': 'emailError',
        'contactMobile': 'mobileError',
        'contactDob': 'dobError'
    };
    
    inputs.forEach(input => {
        input.classList.remove('is-invalid');
        const errorElementId = errorIdMap[input.id] || (input.id + 'Error');
        const errorElement = document.getElementById(errorElementId);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    });
    
    // Reset edit mode
    isEditMode = false;
    currentEditContact = null;
    updateModalForAddMode();
}

// Open modal for editing a contact
function editContact(contact) {
    currentEditContact = contact;
    isEditMode = true;
    
    // Populate form with contact data
    document.getElementById('contactName').value = contact.name || '';
    document.getElementById('contactEmail').value = contact.email || '';
    document.getElementById('contactMobile').value = contact.mobile || '';
    document.getElementById('contactDob').value = contact.dob || '';
    
    // Update modal for edit mode
    updateModalForEditMode();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addContactModal'));
    modal.show();
}

// Update modal UI for edit mode
function updateModalForEditMode() {
    const modalTitle = document.getElementById('addContactModalLabel');
    const saveBtn = document.getElementById('saveContactBtn');
    
    // Update modal title
    modalTitle.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Contact';
    
    // Update button text
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Contact';
}

// Update modal UI for add mode
function updateModalForAddMode() {
    const modalTitle = document.getElementById('addContactModalLabel');
    const saveBtn = document.getElementById('saveContactBtn');
    
    // Update modal title
    modalTitle.innerHTML = '<i class="bi bi-person-plus me-2"></i>Add New Contact';
    
    // Update button text
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Save Contact';
}

// Handle cancel button click
function handleCancel() {
    resetForm();
}

// Handle modal close (when modal is hidden)
function handleModalClose() {
    resetForm();
}

// Set button loading state
function setButtonLoading(loading) {
    const btn = document.getElementById('saveContactBtn');
    if (loading) {
        btn.disabled = true;
        const action = isEditMode ? 'Updating...' : 'Saving...';
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${action}`;
    } else {
        btn.disabled = false;
        if (isEditMode) {
            btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Contact';
        } else {
            btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Save Contact';
        }
    }
}

// Show alert message as toast
function showAlert(message, type) {
    // Remove existing toast alerts
    const existingToasts = document.querySelectorAll('.toast-alert');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 350px;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // Create toast message
    const toastDiv = document.createElement('div');
    toastDiv.className = `toast-alert alert alert-${type} alert-dismissible fade show shadow`;
    toastDiv.style.cssText = `
        margin-bottom: 10px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add icons based on alert type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="bi bi-check-circle-fill me-2"></i>';
            break;
        case 'danger':
            icon = '<i class="bi bi-exclamation-triangle-fill me-2"></i>';
            break;
        case 'warning':
            icon = '<i class="bi bi-exclamation-circle-fill me-2"></i>';
            break;
        case 'info':
            icon = '<i class="bi bi-info-circle-fill me-2"></i>';
            break;
        default:
            icon = '<i class="bi bi-bell-fill me-2"></i>';
    }
    
    toastDiv.innerHTML = `
        ${icon}${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to toast container
    toastContainer.appendChild(toastDiv);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
        if (toastDiv.parentNode) {
            toastDiv.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (toastDiv.parentNode) {
                    toastDiv.remove();
                }
            }, 300);
        }
    }, 4000);
}

function showContactsDetails(contacts) {
    console.log("Search Results: ", contacts);
    let tableBody = document.getElementById("idTableBody");
    tableBody.innerHTML = "";
    if(!contacts || contacts.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No Contacts Found</td></tr>`;
        return;
    }
    contacts.forEach((contact, index) => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <th scope="row">${index + 1}</th>
            <td>${contact.name}</td>
            <td>${contact.dob}</td>
            <td>${contact.email}</td>
            <td>${contact.mobile}</td>
            <td>
                <i class="bi bi-pencil action-icon edit-icon" onclick="editContact(${JSON.stringify(contact).replace(/"/g, '&quot;')})" title="Edit"></i>
                <i class="bi bi-trash action-icon delete-icon" onclick="deleteContactConfirm(${JSON.stringify(contact).replace(/"/g, '&quot;')})" title="Delete"></i>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Delete contact with confirmation
function deleteContactConfirm(contact) {
    // Parse the contact object if it's a string
    if (typeof contact === 'string') {
        try {
            contact = JSON.parse(contact);
        } catch (error) {
            console.error('Error parsing contact object:', error);
            showAlert("Error processing contact data.", "danger");
            return;
        }
    }
    
    // Store contact to delete globally
    contactToDelete = contact;
    
    // Update modal content
    const contactName = contact.name || 'Unknown Contact';
    const contactEmail = contact.email || '';
    const contactMobile = contact.mobile || '';
    
    document.getElementById('contactToDelete').innerHTML = `
        <strong>${contactName}</strong><br>
        <small class="text-muted">${contactEmail} • ${contactMobile}</small>
    `;
    
    // Show the modal
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    deleteModal.show();
}

// Handle confirm delete button click
async function handleConfirmDelete() {
    if (!contactToDelete) {
        showAlert("No contact selected for deletion.", "danger");
        return;
    }
    
    try {
        // Show loading state
        const deleteBtn = document.getElementById('confirmDeleteBtn');
        const originalText = deleteBtn.innerHTML;
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';
        
        await deleteContact(contactToDelete.id);
        
        const contactName = contactToDelete.name || 'Contact';
        showAlert(`Contact "${contactName}" deleted successfully!`, "success");
        
        // Close modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        deleteModal.hide();
        
        // Clear the contact to delete
        contactToDelete = null;
        
        // Refresh the table
        loadAllContacts();
        
    } catch (error) {
        console.error("Error deleting contact:", error);
        showAlert("Error deleting contact. Please try again.", "danger");
    } finally {
        // Reset button state
        const deleteBtn = document.getElementById('confirmDeleteBtn');
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = '<i class="bi bi-trash me-2"></i>Delete Contact';
    }
}

// Initial load of all contacts
async function loadAllContacts() {
    try {
        let contacts = await getContacts();
        showContactsDetails(contacts);
    } catch (error) {
        console.error("Load Contacts Error: ", error);
    }
}

loadAllContacts();
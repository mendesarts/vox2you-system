// Test script to verify CRM routes
const API_URL = 'http://localhost:3000/api';
const token = 'YOUR_TOKEN_HERE'; // Replace with actual token from localStorage

async function testBulkDelete() {
    console.log('Testing bulk delete...');
    try {
        const res = await fetch(`${API_URL}/crm/leads/bulk-delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ leadIds: [999999] }) // Non-existent ID for testing
        });
        const data = await res.json();
        console.log('Bulk delete response:', data);
    } catch (error) {
        console.error('Bulk delete error:', error);
    }
}

async function testLeadUpdate() {
    console.log('Testing lead update...');
    try {
        const res = await fetch(`${API_URL}/crm/leads/999999`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ responsibleId: 1 })
        });
        const data = await res.json();
        console.log('Lead update response:', data);
    } catch (error) {
        console.error('Lead update error:', error);
    }
}

// Run tests
testBulkDelete();
testLeadUpdate();

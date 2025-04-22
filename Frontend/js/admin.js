document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../pages/login.html';
        return;
    }
    await loadUsers();
});
//load users
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });

        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
    
        // Access the data property directly
        const users = result.data || result; 
        
        const usersList = document.getElementById('usersList');
        
        if (!users || users.length === 0) {
            usersList.innerHTML = '<p class="text-center text-gray-500">No hay usuarios restringidos</p>';
            return;
        }

        // show users if there are any
        usersList.innerHTML = users.map(user => `
            <div class="bg-white p-4 rounded-lg shadow-md mb-4">
                <div class="flex items-start gap-4">
                    ${user.avatar ? `
                    <img src="${user.avatar}" alt="${user.fullName}" class="w-16 h-16 rounded-full object-cover">
                    ` : ''}
                    <div>
                        <h3 class="text-xl font-semibold">${user.fullName || 'Nombre no disponible'}</h3>
                        <div class="mt-2">
                            <button onclick="editUser('${user._id}')" class="bg-yellow-500 text-white px-4 py-2 rounded">Editar</button>
                            <button onclick="deleteUser('${user._id}')" class="bg-red-500 text-white px-4 py-2 rounded ml-2">Eliminar</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = `
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                <p class="font-bold">Error al cargar usuarios</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}
//open modal
function openAddUserModal() {
    document.getElementById('modalTitle').textContent = 'Agregar Usuario';
    document.getElementById('userForm').reset();
    document.getElementById('userModal').classList.remove('hidden');
    document.getElementById('button').textContent = 'Guardar';

}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
}

async function editUser(userId) {
    try {
        const token = localStorage.getItem('token');
        
        // Get user data from API
        const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        const user = result.data || result;
        console.log('User data:', user); // Log the user data for debugging
        if (!user || !user._id) {
            throw new Error('Invalid user data received from server');
        }

        document.getElementById('pin').removeAttribute('required');
        // Store original values for comparison
        const originalValues = {
            fullName: user.fullName || '',
            pin: user.pin || '',
            avatar: user.avatar || null
        };

        // Update modal with user data
        document.getElementById('modalTitle').textContent = 'Edit User';
        document.getElementById('button').textContent = 'Update';
        document.getElementById('userId').value = user._id;
        document.getElementById('fullName').value = originalValues.fullName;
        document.getElementById('pin').value = originalValues.pin;
        
        const avatarPreview = document.getElementById('avatarPreview');
        const avatarInput = document.getElementById('avatar');
        
        if (originalValues.avatar) {
            avatarPreview.src = originalValues.avatar;
            avatarPreview.classList.remove('hidden');
        } else {
            avatarPreview.classList.add('hidden');
        }
        
        avatarInput.value = '';
        
        avatarInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    avatarPreview.src = e.target.result;
                    avatarPreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('userModal').classList.remove('hidden');

        const editForm = document.getElementById('userForm');
        editForm.onsubmit = async (e) => {
            e.preventDefault();

            // Get current form values
            const currentValues = {
                fullName: document.getElementById('fullName').value,
                pin: document.getElementById('pin').value,
            };
            
            // Prepare update object with only changed fields
            const updatedUser = {};
            
            if (currentValues.fullName !== originalValues.fullName) {
                updatedUser.fullName = currentValues.fullName;
            }
            
            if (currentValues.pin !== originalValues.pin) {
                // Validate PIN if it's being changed
                const pinRegex = /^[0-9]{6}$/;
                if (!pinRegex.test(currentValues.pin)) {
                    alert('El PIN debe tener 6 dígitos.');
                    return;
                }
                updatedUser.pin = currentValues.pin;
            }
            
            // Handle avatar only if a new file was selected
            const avatarFile = document.getElementById('avatar').files[0];
            if (avatarFile) {
                updatedUser.avatar = await convertToBase64(avatarFile);
            }

            // Only proceed if there are changes
            if (Object.keys(updatedUser).length === 0) {
                alert('No se detectaron cambios para actualizar.');
                return;
            }

            try {
                const updateResponse = await fetch(`http://localhost:3000/api/users/${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(updatedUser),
                });

                if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    throw new Error(errorData.message || 'Failed to update user');
                }

                document.getElementById('userModal').classList.add('hidden');
                await loadUsers();
                
            } catch (error) {
                console.error('Update error:', error);
                alert(`Update failed: ${error.message}`);
            }
        };

    } catch (error) {
        console.error('Error loading user for edit:', error);
        alert(`Error: ${error.message}`);
    }
}

// Helper function to convert file to base64
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}
// delete user
async function deleteUser(userId) {
    const token = localStorage.getItem('token');
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
        await fetch(`http://localhost:3000/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        await loadUsers();
    }
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');    
    const userId = localStorage.getItem('userId');
    const fullName = document.getElementById('fullName').value;
    const pin = document.getElementById('pin').value;
    const avatarInput = document.getElementById('avatar'); // Get the input file
    const avatarFile = avatarInput.files[0]; // Get the file from the input

    // Verify the pin has 6 digits
    const pinRegex = /^[0-9]{6}$/;
    if (!pinRegex.test(pin)) {
        alert('El PIN debe tener 6 dígitos.');
        return; // Stop process if pin is invalid
    }

    // Verify an image is selected and it's valid
    if (!avatarFile && document.getElementById('button').textContent === 'Guardar') {
        alert('Por favor, selecciona una imagen para el avatar.');
        return; //Stop process if no image is selected
    }

    const validAvatarExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const avatarExtension = avatarFile.name.slice(avatarFile.name.lastIndexOf('.')).toLowerCase();
    if (!validAvatarExtensions.includes(avatarExtension)) {
        alert('Por favor, selecciona una imagen válida para el avatar.');
        return; // Stop process if image is invalid
    }

    // filereader to convert image to base64
    const reader = new FileReader();
    reader.onloadend = async function () {
        const avatarBase64 = reader.result; 

        // Build object with user data
        const userData = {
            fullName: fullName,
            pin: pin,
            avatar: avatarBase64, // Save the image as base64
            parentUser: userId 
        };

        if (document.getElementById('button').textContent === 'Guardar') {
            // Send data
            await fetch('http://localhost:3000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(userData), 
            });
        
            closeUserModal();  // Close modal after saving
            await loadUsers(); // reload users
        }
    };

    // read the file as base64
    reader.readAsDataURL(avatarFile);
});

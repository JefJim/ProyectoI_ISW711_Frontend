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
            },
        });

        const users = await response.json();
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = users.map(user => `
            <div class="bg-white p-4 rounded-lg shadow-md mb-4">
                <h3 class="text-xl font-semibold">${user.fullName}</h3>
                <p>PIN: ${user.pin}</p>
                <div class="mt-2">
                    <button onclick="editUser('${user._id}')" class="bg-yellow-500 text-white px-4 py-2 rounded">Editar</button>
                    <button onclick="deleteUser('${user._id}')" class="bg-red-500 text-white px-4 py-2 rounded ml-2">Eliminar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.log('error: ', error);
        alert('Error al cargar los usuarios');
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
    const token = localStorage.getItem('token');

    // Get user data
    const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const user = await response.json();
    // Show user modal with user data
    document.getElementById('modalTitle').textContent = 'Editar Usuario';
    document.getElementById('button').textContent = 'Editar';
    document.getElementById('userId').value = user._id;
    document.getElementById('fullName').value = user.fullName;
    document.getElementById('pin').value = user.pin;
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarInput = document.getElementById('avatar');
    
    if (user.avatar) {
        avatarPreview.src = user.avatar; // Show actual image (base64 o URL)
        avatarPreview.classList.remove('hidden');
    } else {
        avatarPreview.classList.add('hidden');
    }
    
    // Clean input file when modal is opened
    avatarInput.value = ''; 
    
    // Event to convert image to base64 when a new file is selected
    avatarInput.addEventListener('change', function () {
        const file = avatarInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                avatarPreview.src = e.target.result; // Show image preview
                avatarPreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file); // convert to base64
        }
    });
    document.getElementById('userModal').classList.remove('hidden');

    const editForm = document.getElementById('userForm');
    editForm.onsubmit = async (e) => {
        e.preventDefault();

        // Get updated user data
        const updatedUser = {
            fullName: document.getElementById('fullName').value,
            pin: document.getElementById('pin').value,
        };
        
        // if file is selected, convert it to base64
        const avatarFile = document.getElementById('avatar').files[0];
        if (avatarFile) {
            const reader = new FileReader();
            reader.onloadend = async function () {
                updatedUser.avatar = reader.result; // Base64 new avatar
        
                await sendUpdatedUser(updatedUser);
            };
            reader.readAsDataURL(avatarFile);
        } else {
            updatedUser.avatar = avatarPreview.src; // Maintain the current avatar
            await sendUpdatedUser(updatedUser);
        }
        
        async function sendUpdatedUser(userData) {
            try {
                const updateResponse = await fetch(`http://localhost:3000/api/users/${userId}`, {
                    method: 'PATCH', // o 'PATCH'
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(userData),
                });
        
                if (updateResponse.ok) {
                   
                    document.getElementById('userModal').classList.add('hidden');
                    loadUsers();
                } else {
                    const errorData = await updateResponse.json();
                    alert(errorData.error || 'Error al actualizar el usuario');
                }
            } catch (error) {
                alert('Error al conectar con el servidor');
            }
        }

        try {
            // sending put request to the server
            const updateResponse = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'PATCH', // or 'PATCH'
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updatedUser),
            });

            if (updateResponse.ok) {
                alert('Usuario actualizado correctamente');
                document.getElementById('userModal').classList.add('hidden');
                loadUsers();
            } else {
                const errorData = await updateResponse.json();
                alert(errorData.error || 'Error al actualizar el usuario');
            }
        } catch (error) {
            alert('Error al conectar con el servidor');
        }
    };
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
    if (!avatarFile) {
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

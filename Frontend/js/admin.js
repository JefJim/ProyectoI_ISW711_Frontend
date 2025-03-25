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
    document.getElementById('avatar').value = user.avatar;
    document.getElementById('userModal').classList.remove('hidden');

    const editForm = document.getElementById('userForm');
    editForm.onsubmit = async (e) => {
        e.preventDefault();

        // Get updated user data
        const updatedUser = {
            fullName: document.getElementById('fullName').value,
            pin: document.getElementById('pin').value,
            avatar: document.getElementById('avatar').value,
        };

        try {
            // sending put request to the server
            const updateResponse = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'PUT', // or 'PATCH'
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
    const avatarInput = document.getElementById('avatar'); // Obtener el input del archivo
    const avatarFile = avatarInput.files[0]; // Obtener el archivo de imagen

    // Verifica que el PIN tenga 6 dígitos
    const pinRegex = /^[0-9]{6}$/;
    if (!pinRegex.test(pin)) {
        alert('El PIN debe tener 6 dígitos.');
        return; // Detener el proceso si el PIN no es válido
    }

    // Verifica que un avatar haya sido seleccionado y sea una imagen válida
    if (!avatarFile) {
        alert('Por favor, selecciona una imagen para el avatar.');
        return; // Detener el proceso si no se selecciona una imagen
    }

    const validAvatarExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const avatarExtension = avatarFile.name.slice(avatarFile.name.lastIndexOf('.')).toLowerCase();
    if (!validAvatarExtensions.includes(avatarExtension)) {
        alert('Por favor, selecciona una imagen válida para el avatar.');
        return; // Detener el proceso si el avatar no es válido
    }

    // Usamos FileReader para convertir la imagen a una URL de datos base64
    const reader = new FileReader();
    reader.onloadend = async function () {
        const avatarBase64 = reader.result; // Esto es el contenido base64 de la imagen

        // Construir el objeto con los datos del formulario
        const userData = {
            fullName: fullName,
            pin: pin,
            avatar: avatarBase64, // Guardar la imagen como base64
            parentUser: userId // Si es necesario incluir el userId
        };

        if (document.getElementById('button').textContent === 'Guardar') {
            // Enviar la solicitud con el cuerpo en formato JSON
            await fetch('http://localhost:3000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(userData), // Enviar los datos como JSON
            });
        
            closeUserModal();  // Cierra el modal después de guardar
            await loadUsers(); // Recarga la lista de usuarios
        }
    };

    // Leer la imagen como URL base64
    reader.readAsDataURL(avatarFile);
});

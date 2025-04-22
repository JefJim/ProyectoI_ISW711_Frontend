document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../pages/login.html';
        return;
    }
    await loadPlaylists();
});

async function loadPlaylists() {
    loadRestrictedUsers(); // load users in checkboxes

    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        const query = `
            query getPlaylistByUser($parentUser: ID!) {
                playlistsByCreator(parentUser: $parentUser) {
                    _id
                    name
                    associatedProfiles {
                        _id
                        fullName
                    }
                    videos {
                        _id
                        name
                    }
                    createdBy {
                        _id
                        name
                    }
                }
            }
        `;

        const response = await fetch('http://localhost:3000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                query,
                variables: { parentUser: userId }
            })
        });

        const result = await response.json();
        const playlists = result.data.playlistsByCreator;

        const playlistsList = document.getElementById('playlistsList');
        playlistsList.innerHTML = playlists.map(playlist => `
            <div class="bg-white p-4 rounded-lg shadow-md mb-4">
                <h3 class="text-xl font-semibold">${playlist.name}</h3>
                <h3 class="text-xl font-semibold">
                    Perfiles asociados: ${playlist.associatedProfiles && playlist.associatedProfiles.length > 0 
                        ? playlist.associatedProfiles.map(profile => profile.fullName).join(', ')
                        : 'Sin perfiles asociados'}
                </h3>
                <p>Videos: ${playlist.videos.length}</p>
                <div class="mt-2">
                    <button onclick="editPlaylist('${playlist._id}')" class="bg-yellow-500 text-white px-4 py-2 rounded">Editar</button>
                    <button onclick="deletePlaylist('${playlist._id}')" class="bg-red-500 text-white px-4 py-2 rounded ml-2">Eliminar</button>
                    <button onclick="window.location.href='videos.html?playlistId=${playlist._id}'" class="bg-blue-500 text-white px-4 py-2 rounded ml-2">
                        Agregar Videos
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando playlists:', error);
    }
}

async function loadRestrictedUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
        });

        // verify and handle the response
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        // handle the data
        const users = result.data || result;
        
        const associatedProfilesList = document.getElementById('associatedProfilesList');
        
        // handle when there are no users
        if (!users || users.length === 0) {
            associatedProfilesList.innerHTML = '<p class="text-gray-500 italic">No se han creado perfiles restringidos</p>';
            return;
        }

        // Mostrar usuarios en checkboxes
        associatedProfilesList.innerHTML = users.map(user => `
            <label class="flex items-center mt-2">
                <input type="checkbox" value="${user._id}" class="form-checkbox h-5 w-5 text-blue-600">
                <span class="ml-2">${user.fullName || 'Usuario sin nombre'}</span>
            </label>
        `).join('');
    } catch (error) {
        console.error('Error al cargar los usuarios:', error);
        const associatedProfilesList = document.getElementById('associatedProfilesList');
        associatedProfilesList.innerHTML = `
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                <p class="font-bold">Error</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function openAddPlaylistModal() {
    loadRestrictedUsers(); // Load users in checkboxes
    document.getElementById('modalTitle').textContent = 'Agregar Playlist';
    document.getElementById('playlistForm').reset();
    document.getElementById('playlistId').value = '';
    document.getElementById('submitbutton').textContent = 'Guardar';
    document.getElementById('playlistModal').classList.remove('hidden');
}

function closePlaylistModal() {
    document.getElementById('playlistModal').classList.add('hidden');
}

async function editPlaylist(playlistId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/playlists/${playlistId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
        });

        // verify if the response is ok
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        console.log('Respuesta completa del servidor:', result);
        
        // access the playlist data
        const playlist = result.data || result;
        
        // verify if the playlist has the required data
        if (!playlist || !playlist._id || !playlist.name) {
            throw new Error('La playlist no contiene los datos necesarios');
        }

        // update modal with playlist data
        document.getElementById('modalTitle').textContent = 'Editar Playlist';
        document.getElementById('playlistId').value = playlist._id;
        document.getElementById('name').value = playlist.name || ''; // Valor por defecto si es undefined
        
        // load users in checkboxes
        await loadRestrictedUsers();
        
        // Select checkboxes for associated profiles
        if (playlist.associatedProfiles && Array.isArray(playlist.associatedProfiles)) {
            const checkboxes = document.querySelectorAll('#associatedProfilesList input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                const isAssociated = playlist.associatedProfiles.some(
                    profile => profile._id === checkbox.value || profile === checkbox.value
                );
                checkbox.checked = isAssociated;
            });
        }

        // show modal
        document.getElementById('playlistModal').classList.remove('hidden');

    } catch (error) {
        console.error('Error al cargar playlist para editar:', error);
        alert(`Error: ${error.message}`);
    }
}

async function deletePlaylist(playlistId) {
    const token = localStorage.getItem('token');
    if (confirm('¿Estás seguro de eliminar esta playlist?')) {
        await fetch(`http://localhost:3000/api/playlists/${playlistId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }
    loadPlaylists();
}

document.getElementById('playlistForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const playlistId = document.getElementById('playlistId').value;
    const name = document.getElementById('name').value;

    // Get ids of users selected in the checkboxes
    const associatedProfiles = Array.from(document.querySelectorAll('#associatedProfilesList input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    const url = playlistId ? `http://localhost:3000/api/playlists/${playlistId}` : 'http://localhost:3000/api/playlists';
    const method = playlistId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ name, associatedProfiles }),
        });

        if (!response.ok) {
            throw new Error('Error al guardar la playlist');
        }
        const result = await response.json();
        // Close modal and reload playlists
        closePlaylistModal();
        await loadPlaylists();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar la playlist');
    }
});
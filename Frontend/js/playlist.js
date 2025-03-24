document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../pages/login.html';
        return;
    }
    await loadPlaylists();
    await loadRestrictedUsers();
});

async function loadPlaylists() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/playlists', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const playlists = await response.json();
        const playlistsList = document.getElementById('playlistsList');
        playlistsList.innerHTML = playlists.map(playlist => `
            <div class="bg-white p-4 rounded-lg shadow-md mb-4">
                <h3 class="text-xl font-semibold">${playlist.name}</h3>
                <h3 class="text-xl font-semibold">
                    Perfiles asociados: ${playlist.associatedProfiles.length > 0 
                        ? playlist.associatedProfiles.map(profile => profile.fullName).join(', ') //Maping the profiles to get the full name
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
        alert('Error al cargar las playlists');
    }
}

async function loadRestrictedUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const users = await response.json();
        const associatedProfilesList = document.getElementById('associatedProfilesList');
        associatedProfilesList.innerHTML = users.map(user => `
            <label class="flex items-center mt-2">
                <input type="checkbox" value="${user._id}" class="form-checkbox h-5 w-5 text-blue-600">
                <span class="ml-2">${user.fullName}</span>
            </label>
        `).join('');
    } catch (error) {
        console.error('Error al cargar los usuarios:', error);
        alert('Error al cargar los usuarios');
    }
}

function openAddPlaylistModal() {
    loadRestrictedUsers(); // Load users in checkboxes
    document.getElementById('modalTitle').textContent = 'Agregar Playlist';
    document.getElementById('playlistForm').reset();
    document.getElementById('playlistId').value = '';
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
            },
        });

        if (!response.ok) {
            throw new Error('Error al cargar la playlist');
        }
        const playlist = await response.json();
        // Update modal with playlist data
        document.getElementById('modalTitle').textContent = 'Editar Playlist';
        document.getElementById('submitbutton').textContent = 'Editar';
        document.getElementById('playlistId').value = playlist._id;
        document.getElementById('name').value = playlist.name;

        // Load all users and select the ones associated with the playlist
        await loadRestrictedUsers();

        // Select users previously associated with the playlist
        const associatedProfilesList = document.getElementById('associatedProfilesList');
        Array.from(associatedProfilesList.querySelectorAll('input[type="checkbox"]')).forEach(checkbox => {
            if (playlist.associatedProfiles.some(profile => profile._id === checkbox.value)) {
                checkbox.checked = true; // Check the checkbox if user is associated
            }
        });

        // Show modal
        document.getElementById('playlistModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar la playlist');
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
        await loadPlaylists();
    }
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
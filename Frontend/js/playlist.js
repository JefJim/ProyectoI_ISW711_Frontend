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
                <p>Videos: ${playlist.videos.length}</p>
                <div class="mt-2">
                    <button onclick="editPlaylist('${playlist._id}')" class="bg-yellow-500 text-white px-4 py-2 rounded">Editar</button>
                    <button onclick="deletePlaylist('${playlist._id}')" class="bg-red-500 text-white px-4 py-2 rounded ml-2">Eliminar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        alert('Error al cargar las playlists');
    }
}

async function loadRestrictedUsers() {
    const response = await fetch('http://localhost:3000/api/users', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const users = await response.json();
    const select = document.getElementById('associatedProfiles');
    select.innerHTML = users.map(user => `
        <option value="${user._id}">${user.fullName}</option>
    `).join('');
}

function openAddPlaylistModal() {
    document.getElementById('modalTitle').textContent = 'Agregar Playlist';
    document.getElementById('playlistForm').reset();
    document.getElementById('playlistId').value = '';
    document.getElementById('playlistModal').classList.remove('hidden');
}

function closePlaylistModal() {
    document.getElementById('playlistModal').classList.add('hidden');
}

async function editPlaylist(playlistId) {
    const response = await fetch(`http://localhost:3000/api/playlists/${playlistId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const playlist = await response.json();
    document.getElementById('modalTitle').textContent = 'Editar Playlist';
    document.getElementById('playlistId').value = playlist._id;
    document.getElementById('name').value = playlist.name;
    document.getElementById('associatedProfiles').value = playlist.associatedProfiles;
    document.getElementById('playlistModal').classList.remove('hidden');
}

async function deletePlaylist(playlistId) {
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

    const playlistId = document.getElementById('playlistId').value;
    const name = document.getElementById('name').value;
    const associatedProfiles = Array.from(document.getElementById('associatedProfiles').selectedOptions).map(option => option.value);

    const url = playlistId ? `http://localhost:3000/api/playlists/${playlistId}` : 'http://localhost:3000/api/playlists';
    const method = playlistId ? 'PUT' : 'POST';

    await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, associatedProfiles }),
    });

    closePlaylistModal();
    await loadPlaylists();
});
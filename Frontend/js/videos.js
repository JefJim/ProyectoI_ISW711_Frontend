document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    const playlistId = new URLSearchParams(window.location.search).get('playlistId');
    if (!playlistId) {
        window.location.href = '/pages/playlists.html';
        return;
    }

    await loadVideos(playlistId);
});

async function loadVideos(playlistId) {
    try {
        const response = await fetch(`http://localhost:3000/api/videos/playlist/${playlistId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const videos = await response.json();
        const videosList = document.getElementById('videosList');
        videosList.innerHTML = videos.map(video => `
            <div class="bg-white p-4 rounded-lg shadow-md mb-4">
                <h3 class="text-xl font-semibold">${video.name}</h3>
                <p>${video.description}</p>
                <div class="mt-2">
                    <button onclick="editVideo('${video._id}')" class="bg-yellow-500 text-white px-4 py-2 rounded">Editar</button>
                    <button onclick="deleteVideo('${video._id}')" class="bg-red-500 text-white px-4 py-2 rounded ml-2">Eliminar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        alert('Error al cargar los videos');
    }
}

function openAddVideoModal() {
    document.getElementById('modalTitle').textContent = 'Agregar Video';
    document.getElementById('videoForm').reset();
    document.getElementById('videoId').value = '';
    document.getElementById('videoModal').classList.remove('hidden');
}

function closeVideoModal() {
    document.getElementById('videoModal').classList.add('hidden');
}

async function editVideo(videoId) {
    const response = await fetch(`http://localhost:3000/api/videos/${videoId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const video = await response.json();
    document.getElementById('modalTitle').textContent = 'Editar Video';
    document.getElementById('videoId').value = video._id;
    document.getElementById('name').value = video.name;
    document.getElementById('url').value = video.url;
    document.getElementById('description').value = video.description;
    document.getElementById('videoModal').classList.remove('hidden');
}

async function deleteVideo(videoId) {
    if (confirm('¿Estás seguro de eliminar este video?')) {
        await fetch(`http://localhost:3000/api/videos/${videoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        await loadVideos(new URLSearchParams(window.location.search).get('playlistId'));
    }
}

document.getElementById('videoForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const videoId = document.getElementById('videoId').value;
    const name = document.getElementById('name').value;
    const videoUrl = document.getElementById('url').value; // Cambiado de 'url' a 'videoUrl'
    const description = document.getElementById('description').value;
    const playlistId = new URLSearchParams(window.location.search).get('playlistId');

    const apiUrl = videoId ? `http://localhost:3000/api/videos/${videoId}` : 'http://localhost:3000/api/videos'; // Cambiado de 'url' a 'apiUrl'
    const method = videoId ? 'PUT' : 'POST';

    await fetch(apiUrl, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, url: videoUrl, description, playlist: playlistId }),
    });

    closeVideoModal();
    await loadVideos(playlistId);
});
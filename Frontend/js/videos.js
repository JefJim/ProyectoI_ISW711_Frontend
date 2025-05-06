let todosLosVideos = [];

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../pages/login.html';
        return;
    }

    const playlistID = new URLSearchParams(window.location.search).get('playlistId');
    if (!playlistID) {
        window.location.href = '../pages/playlists.html';
        return;
    }

    await loadVideos(playlistID);
});

async function loadVideos(playlistID) {
    try {
        const token = localStorage.getItem('token');
        const userID = localStorage.getItem('userId');

        const query = `
            query GetPlaylistVideos($playlistId: ID!, $userId: ID!) {
                playlistVideos(playlistId: $playlistId, userId: $userId) {
                    _id
                    name
                    url
                    description
                    duration
                    playlist {
                        _id
                        createdBy {
                            _id
                        }
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
                variables: { playlistId: playlistID, userId: userID }
            })
        });

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0].message);
        }

        const videosList = document.getElementById('videosList');
        const videos = result.data.playlistVideos;
        todosLosVideos = videos; // Guardamos la lista completa
        if (videos.length === 0) {
            videosList.innerHTML = '<p class="text-center text-gray-500 py-4">No hay videos válidos en esta playlist</p>';
            return;
        }

        if (!videos || videos.length === 0) {
            videosList.innerHTML = '<p class="text-center text-gray-500 py-4">Aún no se han agregado videos</p>';
            return;
        }

        videosList.innerHTML = videos.map(video => `
            <div class="w-85 h-100 bg-white p-4 rounded-lg shadow-md mb-4">
                <div class="flex flex-col space-y-2">
                    <h3 class="text-lg font-semibold line-clamp-2">${video.name}</h3>
                    <div class="aspect-w-16 aspect-h-9">
                        <iframe 
                            class="w-80 h-48 rounded-lg"
                            src="https://www.youtube.com/embed/${extractVideoId(video.url)}"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen>
                        </iframe>
                    </div>
                    ${video.description ? `
                        <p class="text-sm text-gray-600 line-clamp-2">
                            ${video.description}
                        </p>
                    ` : ''}
                    <div class="flex flex-wrap gap-2 mt-2">
                        <button onclick="editVideo('${video._id}')" class="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded">
                            Editar
                        </button>
                        <button onclick="deleteVideo('${video._id}')" class="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar videos:', error);
        const videosList = document.getElementById('videosList');
        videosList.innerHTML = `
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                <p class="font-bold">Error al cargar videos</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function formatDuration(isoDuration) {
    if (!isoDuration) return '';
    
    const hours = isoDuration.match(/(\d+)H/);  
    const minutes = isoDuration.match(/(\d+)M/);
    const seconds = isoDuration.match(/(\d+)S/);

    const hh = hours ? hours[1].padStart(2, '0') : '00';
    const mm = minutes ? minutes[1].padStart(2, '0') : '00';
    const ss = seconds ? seconds[1].padStart(2, '0') : '00';

    if (hours) {
        return `${hh}:${mm}:${ss}`;
    } else {
        return `${mm}:${ss}`;
    }
}

function extractVideoId(videoURL) {
    if (!videoURL) return null;

    const patterns = [
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
        /youtu\.be\/([^"&?\/\s]{11})/i,
        /youtube\.com\/embed\/([^"&?\/\s]{11})/i,
        /youtube\.com\/watch\?.*v=([^"&?\/\s]{11})/i
    ];

    for (const pattern of patterns) {
        const match = videoURL.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
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

async function editVideo(videoID) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/videos/${videoID}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result || !result.data) {
            throw new Error('La respuesta del servidor no contiene datos válidos');
        }

        const video = result.data;

        if (!video._id || !video.name || !video.url) {
            throw new Error('Faltan campos requeridos en los datos del video');
        }

        document.getElementById('modalTitle').textContent = 'Editar Video';
        document.getElementById('videoId').value = video._id || '';
        document.getElementById('name').value = video.name || '';
        document.getElementById('url').value = video.url || '';
        document.getElementById('description').value = video.description || '';
        
        document.getElementById('videoModal').classList.remove('hidden');

    } catch (error) {
        console.error('Error al cargar video para editar:', error);
        alert(`Error al cargar el video: ${error.message}`);
    }
}

async function deleteVideo(videoID) {
    const token = localStorage.getItem('token');
    if (confirm('¿Estás seguro de eliminar este video?')) {
        await fetch(`http://localhost:3000/api/videos/${videoID}`, {
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

    const videoID = document.getElementById('videoId').value;
    const videoName = document.getElementById('name').value;
    const videoURL = document.getElementById('url').value;
    const videoDescription = document.getElementById('description').value;
    const playlistID = new URLSearchParams(window.location.search).get('playlistId');

    const apiURL = videoID ? `http://localhost:3000/api/videos/${videoID}` : 'http://localhost:3000/api/videos'; 
    const method = videoID ? 'PUT' : 'POST';
    const token = localStorage.getItem('token');

    await fetch(apiURL, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: videoName, url: videoURL, description: videoDescription, playlist: playlistID }),
    });

    closeVideoModal();
    await loadVideos(playlistID);
});
function filtrarVideos() {
    const termino = document.getElementById('searchInput').value.toLowerCase();

    const videosFiltrados = todosLosVideos.filter(video =>
        video.name.toLowerCase().includes(termino) ||
        (video.description && video.description.toLowerCase().includes(termino))
    );

    const videosList = document.getElementById('videosList');

    if (videosFiltrados.length === 0) {
        videosList.innerHTML = '<p class="text-center text-gray-500 py-4">No se encontraron videos</p>';
        return;
    }

    videosList.innerHTML = videosFiltrados.map(video => `
        <div class="w-85 h-100 bg-white p-4 rounded-lg shadow-md mb-4">
            <div class="flex flex-col space-y-2">
                <h3 class="text-lg font-semibold line-clamp-2">${video.name}</h3>
                <div class="aspect-w-16 aspect-h-9">
                    <iframe 
                        class="w-80 h-48 rounded-lg"
                        src="https://www.youtube.com/embed/${extractVideoId(video.url)}"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                </div>
                ${video.description ? `
                    <p class="text-sm text-gray-600 line-clamp-2">
                        ${video.description}
                    </p>
                ` : ''}
                <div class="flex flex-wrap gap-2 mt-2">
                    <button onclick="editVideo('${video._id}')" class="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded">
                        Editar
                    </button>
                    <button onclick="deleteVideo('${video._id}')" class="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

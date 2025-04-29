document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../pages/login.html';
        return;
    }

    const playlistId = new URLSearchParams(window.location.search).get('playlistId');
    if (!playlistId) {
        window.location.href = '../pages/playlists.html';
        return;
    }

    await loadVideos(playlistId);
});

async function loadVideos(playlistId) {
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

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
                variables: { playlistId, userId }
            })
        });

        const result = await response.json();
        
        if (result.errors) {
            throw new Error(result.errors[0].message);
        }
        const videosList = document.getElementById('videosList');
        const videos = result.data.playlistVideos;
        if (videos.length === 0) {
            videosList.innerHTML = '<p class="text-center text-gray-500 py-4">No hay videos válidos en esta playlist</p>';
            return;
          }
        
        if (!videos || videos.length === 0) {
            videosList.innerHTML = '<p class="text-center text-gray-500 py-4">Aún no se han agregado videos</p>';
            return;
        }

        // Mostrar videos (mantén tu lógica actual de renderizado)
        videosList.innerHTML = videos.map(video => `
            <div class="w-85 h-100 bg-white p-4 rounded-lg shadow-md mb-4">
                <div class="flex flex-col space-y-2">
                    <!-- Título del video -->
                    <h3 class="text-lg font-semibold line-clamp-2">${video.name}</h3>
                    
                    <!-- Video embed (tamaño reducido) -->
                    <div class="aspect-w-16 aspect-h-9">
                        <iframe 
                            class="w-80 h-48 rounded-lg"  // 320x180 aprox
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
                        <button onclick="editVideo('${video._id}')" 
                            class="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded">
                            Editar
                        </button>
                        <button onclick="deleteVideo('${video._id}')" 
                            class="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
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

// funtion to format ISO 8601 duration (PT#H#M#S) to HH:MM:SS or MM:SS
function formatDuration(isoDuration) {
    if (!isoDuration) return '';
    
    // get hours, minutes and seconds from ISO 8601 duration
    const hours = isoDuration.match(/(\d+)H/);  
    const minutes = isoDuration.match(/(\d+)M/);
    const seconds = isoDuration.match(/(\d+)S/);
    
    // format each component to 2 digits
    const hh = hours ? hours[1].padStart(2, '0') : '00';
    const mm = minutes ? minutes[1].padStart(2, '0') : '00';
    const ss = seconds ? seconds[1].padStart(2, '0') : '00';
    
    // build final format
    if (hours) {
        return `${hh}:${mm}:${ss}`; // format HH:MM:SS
    } else {
        return `${mm}:${ss}`; // format MM:SS for <1h duration
    }
}
function extractVideoId(url) {
    if (!url) return null;
    
    const patterns = [
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
        /youtu\.be\/([^"&?\/\s]{11})/i,
        /youtube\.com\/embed\/([^"&?\/\s]{11})/i,
        /youtube\.com\/watch\?.*v=([^"&?\/\s]{11})/i
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
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

async function editVideo(videoId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/videos/${videoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        // Veryfy if the response is ok
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        // verify if the result has data
        if (!result || !result.data) {
            throw new Error('La respuesta del servidor no contiene datos válidos');
        }

        const video = result.data; // access the video data

        // verify if the video has the required data
        if (!video._id || !video.name || !video.url) {
            throw new Error('Faltan campos requeridos en los datos del video');
        }

        // fill the modal with video data
        document.getElementById('modalTitle').textContent = 'Editar Video';
        document.getElementById('videoId').value = video._id || '';
        document.getElementById('name').value = video.name || '';
        document.getElementById('url').value = video.url || '';
        document.getElementById('description').value = video.description || '';
        
        // show modal
        document.getElementById('videoModal').classList.remove('hidden');

    } catch (error) {
        console.error('Error al cargar video para editar:', error);
        alert(`Error al cargar el video: ${error.message}`);
    }
}

async function deleteVideo(videoId) {
    const token = localStorage.getItem('token');
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
    const videoUrl = document.getElementById('url').value; // 
    const description = document.getElementById('description').value;
    const playlistId = new URLSearchParams(window.location.search).get('playlistId');

    const apiUrl = videoId ? `http://localhost:3000/api/videos/${videoId}` : 'http://localhost:3000/api/videos'; 
    const method = videoId ? 'PUT' : 'POST';
    const token = localStorage.getItem('token');

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
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
        const response = await fetch(`http://localhost:3000/api/videos/playlist/${playlistId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al cargar videos');
        }

        const result = await response.json();
        const videos = result.data;
        
        const videosList = document.getElementById('videosList');
        
        if (!videos || videos.length === 0) {
            videosList.innerHTML = '<p class="text-center text-gray-500 py-4">Aún no se han agregado videos</p>';
            return;
        }

        // show videos
        videosList.innerHTML = videos.map(video => `
            <div class="bg-white p-4 rounded-lg shadow-md mb-6">
                <div class="flex flex-col md:flex-row gap-4">
                    <!-- Video Embed -->
                    <div class="w-full md:w-1/2">
                        <iframe 
                            class="w-full h-64 rounded-lg"
                            src="https://www.youtube.com/embed/${extractVideoId(video.url)}"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen>
                        </iframe>
                    </div>
                    
                    <!-- Información del video -->
                    <div class="w-full md:w-1/2">
                        <h3 class="text-xl font-semibold mb-2">${video.name}</h3>
                        <p class="text-gray-600 mb-2">${video.description || 'Sin descripción'}</p>
                        
                        ${video.duration ? `
                        <div class="flex items-center text-sm text-gray-500 mb-4">
                            <span>Duración: ${formatDuration(video.duration)}</span>
                        </div>
                        ` : ''}
                        
                        <!-- Controles CRUD -->
                        <div class="flex flex-wrap gap-2 mt-4">
                            <button onclick="editVideo('${video._id}')" 
                                class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition">
                                <i class="fas fa-edit mr-2"></i>Editar
                            </button>
                            <button onclick="deleteVideo('${video._id}')" 
                                class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition">
                                <i class="fas fa-trash mr-2"></i>Eliminar
                            </button>
                            <a href="${video.url}" target="_blank" 
                                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
                                <i class="fas fa-external-link-alt mr-2"></i>Ver en YouTube
                            </a>
                        </div>
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
document.addEventListener('DOMContentLoaded', async () => {
    const restrictedUserId = localStorage.getItem('restrictedUserId');
    if (!restrictedUserId) {
        window.location.href = '../pages/login.html';
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/playlists/playlist/${restrictedUserId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al cargar las playlists');
        }

        const result = await response.json();
        const playlists = result.data || result;
        
        // verify if the user has playlists
        if (!playlists || playlists.length === 0) {
            document.getElementById('videosList').innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500 text-lg">No hay playlists disponibles</p>
                </div>
            `;
            return;
        }

        // get all videos from playlists associated with the restricted user
        const videos = playlists.flatMap(playlist => 
            playlist.videos ? playlist.videos.map(video => ({
                ...video,
                playlistName: playlist.name // Agregar nombre de la playlist
            })) : []
        );

        // show videos
        const videosList = document.getElementById('videosList');
        
        if (!videos || videos.length === 0) {
            videosList.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500 text-lg">No hay videos disponibles en tus playlists</p>
                </div>
            `;
            return;
        }

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
                        ${video.playlistName ? `
                        <div class="mb-2">
                            <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                ${video.playlistName}
                            </span>
                        </div>
                        ` : ''}
                        
                        <h3 class="text-xl font-semibold mb-2">${video.name}</h3>
                        <p class="text-gray-600 mb-2">${video.description || 'Sin descripción'}</p>
                        
                        ${video.duration ? `
                        <div class="flex items-center text-sm text-gray-500 mb-4">
                            <span>Duración: ${formatDuration(video.duration)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('videosList').innerHTML = `
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                <p class="font-bold">Error al cargar los videos</p>
                <p>${error.message}</p>
            </div>
        `;
    }
});

// function to extract video ID from YouTube URL
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

// function to format ISO 8601 duration to HH:MM:SS or MM:SS
function formatDuration(isoDuration) {
    if (!isoDuration) return '';
    
    const hours = isoDuration.match(/(\d+)H/);  
    const minutes = isoDuration.match(/(\d+)M/);
    const seconds = isoDuration.match(/(\d+)S/);
    
    const hh = hours ? hours[1].padStart(2, '0') : '00';
    const mm = minutes ? minutes[1].padStart(2, '0') : '00';
    const ss = seconds ? seconds[1].padStart(2, '0') : '00';
    
    return hours ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
}
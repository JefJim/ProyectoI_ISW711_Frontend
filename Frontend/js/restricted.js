document.addEventListener('DOMContentLoaded', async () => {
    const restrictedUserId = localStorage.getItem('restrictedUserId');
    if (!restrictedUserId) {
        window.location.href = '../pages/login.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/playlists?userId=${restrictedUserId}`);
        const playlists = await response.json();

        const videosList = document.getElementById('videosList');
        videosList.innerHTML = playlists.flatMap(playlist => playlist.videos.map(video => `
            <div class="bg-white p-4 rounded-lg shadow-md">
                <h3 class="text-xl font-semibold">${video.name}</h3>
                <p>${video.description}</p>
                <iframe class="w-full h-48 mt-4" src="https://www.youtube.com/embed/${extractVideoId(video.url)}" frameborder="0" allowfullscreen></iframe>
            </div>
        `)).join('');
    } catch (error) {
        alert('Error al cargar los videos');
    }
});

function extractVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}
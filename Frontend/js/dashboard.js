document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../pages/login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const users = await response.json();

        const usersContainer = document.getElementById('restrictedUsers');
        usersContainer.innerHTML = users.map(user => `
            <div class="bg-white p-4 rounded-lg shadow-md text-center">
                <img src="${user.avatar}" alt="${user.fullName}" class="w-24 h-24 mx-auto rounded-full">
                <h2 class="text-xl font-semibold mt-2">${user.fullName}</h2>
                <button onclick="enterRestrictedUser('${user._id}')" class="mt-4 bg-green-500 text-white px-4 py-2 rounded">Entrar</button>
            </div>
        `).join('');
    } catch (error) {
        alert('Error al cargar los usuarios restringidos');
    }
});

function enterRestrictedUser(userId) {
    localStorage.setItem('restrictedUserId', userId);
    window.location.href = '../pages/restricted.html';
}
document.getElementById('logoutButton').addEventListener('click', () => {
    // Borrar el user._id del localStorage
    localStorage.removeItem('userId');

    // Borrar el token del localStorage (si lo tiene almacenado)
    localStorage.removeItem('token');

    // Redirigir al usuario a la página de inicio de sesión o a la página principal
    window.location.href = 'login.html'; 
});
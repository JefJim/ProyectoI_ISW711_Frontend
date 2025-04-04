document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../pages/login.html';
        return;
    }
    // ADding event listeners to restricted links
    setupRestrictedLinks();
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

async function enterRestrictedUser(userId) {
    const userPin = prompt('Ingrese el PIN del usuario restringido:');

    if (!userPin) {
        alert('Debe ingresar un PIN para continuar.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users/verify-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ id: userId, pin: userPin })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('restrictedUserId', userId);
            window.location.href = '../pages/restricted.html';
        } else {
            alert(data.error || 'PIN incorrecto. Intente de nuevo.');
        }
    } catch (error) {
        alert('Error al verificar el PIN. Intente nuevamente.');
    }
}

function setupRestrictedLinks() {
    const restrictedLink = document.querySelector('a[href="admin.html"]');
    const adminLink = document.querySelector('a[href="playlist.html"]');

    if (restrictedLink) {
        restrictedLink.addEventListener('click', async (event) => {
            event.preventDefault();
            verifyUserPin('admin.html');
        });
    }

    if (adminLink) {
        adminLink.addEventListener('click', async (event) => {
            event.preventDefault();
            verifyUserPin('playlist.html');
        });
    }
}

async function verifyUserPin(redirectUrl) {
    const userId = localStorage.getItem('userId');
    console.log(userId);
    if (!userId) {
        alert('Debes iniciar sesión primero.');
        return;
    }

    const userPin = prompt('Ingrese su PIN de verificación:');

    if (!userPin) {
        alert('Debe ingresar un PIN para continuar.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users/main/verify-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ id: userId, pin: userPin })
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = redirectUrl;
        } else {
            alert(data.error || 'PIN incorrecto. Intente de nuevo.');
        }
    } catch (error) {
        alert('Error al verificar el PIN. Intente nuevamente.');
    }
}

document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

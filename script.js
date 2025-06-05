const nameDisplayArea = document.getElementById('nameDisplayArea');
const historyPanel = document.getElementById('historyPanel');
const favoritesPanel = document.getElementById('favoritesPanel');
const historyListEl = document.getElementById('historyList');
const favoritesListEl = document.getElementById('favoritesList');

const MAX_HISTORY = 20;
const NUM_NAMES_TO_GENERATE = 3;

let favorites = JSON.parse(localStorage.getItem('luminous_favorites')) || [];
let history = JSON.parse(localStorage.getItem('luminous_history')) || [];

function saveFavorites() {
    localStorage.setItem('luminous_favorites', JSON.stringify(favorites));
}

function saveHistory() {
    localStorage.setItem('luminous_history', JSON.stringify(history));
}

async function fetchNames(file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Failed to fetch ${file}`);
        const text = await response.text();
        return text.trim().split('\n').map(name => name.trim()).filter(name => name);
    } catch (error) {
        console.error('Error fetching names:', error);
        nameDisplayArea.innerHTML = `<p class="error-message">Error loading name data. Please try again.</p>`;
        return [];
    }
}

async function generateSingleNameConfig() {
    const gender = document.getElementById('gender').value;
    const includeNickname = document.getElementById('includeNickname').checked;
    const namesFile = gender === 'female' ? 'FemaleNames.txt' : 'MaleNames.txt';

    const [firstNames, nicknamesData, surnamesData] = await Promise.all([
        fetchNames(namesFile),
        includeNickname ? fetchNames('Nicknames.txt') : Promise.resolve([]),
        fetchNames('Surnames.txt')
    ]);

    if (!firstNames.length || !surnamesData.length || (includeNickname && !nicknamesData.length && nicknamesData)) { 
    }

    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomNickname = includeNickname && nicknamesData && nicknamesData.length > 0 ? nicknamesData[Math.floor(Math.random() * nicknamesData.length)] : '';
    const randomSurname = surnamesData[Math.floor(Math.random() * surnamesData.length)];

    return {
        firstName: randomFirstName,
        nickname: randomNickname,
        surname: randomSurname,
        fullName: includeNickname && randomNickname ? `${randomFirstName} "${randomNickname}" ${randomSurname}` : `${randomFirstName} ${randomSurname}`
    };
}

async function generateAndDisplayNames() {
    const generateBtn = document.querySelector('.generate-btn');
    const btnText = generateBtn.querySelector('.btn-text');
    const originalBtnText = btnText.textContent;
    btnText.textContent = 'Generating...';
    generateBtn.disabled = true;

    nameDisplayArea.innerHTML = ''; 
    
    const generatedNamesSet = [];

    for (let i = 0; i < NUM_NAMES_TO_GENERATE; i++) {
        const nameConfig = await generateSingleNameConfig();
        if (nameConfig) {
            generatedNamesSet.push(nameConfig);
        }
    }
    
    if (generatedNamesSet.length > 0) {
        addToHistory(generatedNamesSet.map(nc => nc.fullName));
        displayNames(generatedNamesSet);
    } else if (!nameDisplayArea.querySelector('.error-message')) {
        nameDisplayArea.innerHTML = '<p class="error-msg-main">Could not generate names. Check data files.</p>';
    }

    btnText.textContent = originalBtnText;
    generateBtn.disabled = false;
}

function displayNames(namesArray) {
    nameDisplayArea.innerHTML = '';
    namesArray.forEach(nameConfig => {
        const nameItem = createNameItemElement(nameConfig.fullName);
        nameDisplayArea.appendChild(nameItem);
    });
}

function createNameItemElement(fullName, isFavoriteList = false, isHistoryList = false) {
    const nameItem = document.createElement('div');
    nameItem.classList.add('name-item');

    const nameText = document.createElement('span');
    nameText.classList.add('name-text');
    nameText.textContent = fullName;
    nameItem.appendChild(nameText);

    const actions = document.createElement('div');
    actions.classList.add('name-actions');

    const copyBtn = document.createElement('button');
    copyBtn.type = "button";
    copyBtn.title = "Copy Name";
    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>`;
    copyBtn.onclick = () => copyToClipboard(fullName, copyBtn);
    actions.appendChild(copyBtn);

    if (!isHistoryList) { 
        const favBtn = document.createElement('button');
        favBtn.type = "button";
        favBtn.title = "Favorite";
        const isFav = favorites.includes(fullName);
        if (isFav) favBtn.classList.add('favorited');
        favBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`;
        favBtn.onclick = () => toggleFavorite(fullName, favBtn);
        actions.appendChild(favBtn);
    }
    
    if (isFavoriteList) {
        const removeFavBtn = document.createElement('button');
        removeFavBtn.type = "button";
        removeFavBtn.title = "Remove Favorite";
        removeFavBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" width="16" height="16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>`;
        removeFavBtn.onclick = () => {
            toggleFavorite(fullName, null); 
            nameItem.remove(); 
            if (favoritesListEl.children.length === 0 || (favoritesListEl.children.length === 1 && favoritesListEl.firstElementChild.classList.contains('empty-list-msg'))) {
                renderFavorites(); 
            }
        };
        actions.appendChild(removeFavBtn);
    }
    nameItem.appendChild(actions);
    return nameItem;
}

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalIcon = button.innerHTML;
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg>`;
        button.title = "Copied!";
        button.disabled = true;
        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.title = "Copy Name";
            button.disabled = false;
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function toggleFavorite(fullName, button) {
    const index = favorites.indexOf(fullName);
    if (index > -1) {
        favorites.splice(index, 1);
        if (button) button.classList.remove('favorited');
    } else {
        favorites.push(fullName);
        if (button) button.classList.add('favorited');
    }
    saveFavorites();
    if (favoritesPanel.classList.contains('open')) {
      renderFavorites(); 
    }
    document.querySelectorAll('#nameDisplayArea .name-item').forEach(item => {
        const nameText = item.querySelector('.name-text').textContent;
        if (nameText === fullName) {
            const favBtnInMain = item.querySelector('.name-actions button[title="Favorite"]');
            if (favBtnInMain) {
                if (favorites.includes(fullName)) {
                    favBtnInMain.classList.add('favorited');
                } else {
                    favBtnInMain.classList.remove('favorited');
                }
            }
        }
    });
}

function addToHistory(nameSet) {
    history.unshift(nameSet); 
    if (history.length > MAX_HISTORY) {
        history.pop(); 
    }
    saveHistory();
    if (historyPanel.classList.contains('open')) {
        renderHistory(); 
    }
}

function renderHistory() {
    historyListEl.innerHTML = '';
    if (history.length === 0) {
        historyListEl.innerHTML = '<p class="empty-list-msg">History is empty.</p>';
        return;
    }
    history.forEach(nameSetOrName => {
        const namesToDisplay = Array.isArray(nameSetOrName) ? nameSetOrName : [nameSetOrName];
        let groupDiv = document.createElement('div'); 
        groupDiv.classList.add('history-group');

        namesToDisplay.forEach(name => {
            const item = createNameItemElement(name, false, true); 
            groupDiv.appendChild(item);
        });
        historyListEl.appendChild(groupDiv);
    });
}

function renderFavorites() {
    favoritesListEl.innerHTML = '';
     if (favorites.length === 0) {
        favoritesListEl.innerHTML = '<p class="empty-list-msg">No favorites yet.</p>';
        return;
    }
    favorites.forEach(name => {
        const item = createNameItemElement(name, true); 
        favoritesListEl.appendChild(item);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    particlesJS('particles-js', {
      particles: {
        number: { value: 60, density: { enable: true, value_area: 800 } },
        color: { value: '#A0B0C0' },
        shape: { type: 'circle', stroke: { width: 0, color: '#000000' } },
        opacity: {
          value: 0.3, random: true,
          anim: { enable: true, speed: 0.2, opacity_min: 0.05, sync: false }
        },
        size: {
          value: 2.2, random: true,
          anim: { enable: true, speed: 1.5, size_min: 0.3, sync: false }
        },
        line_linked: { enable: false },
        move: {
          enable: true, speed: 0.25, direction: 'none', random: true,
          straight: false, out_mode: 'out', bounce: false
        }
      },
      interactivity: {
        detect_on: 'canvas',
        events: { onhover: { enable: false }, onclick: { enable: false }, resize: true }
      },
      retina_detect: true
    });

    document.getElementById('historyBtn').addEventListener('click', () => {
        renderHistory();
        historyPanel.classList.add('open');
        favoritesPanel.classList.remove('open');
    });

    document.getElementById('favoritesBtn').addEventListener('click', () => {
        renderFavorites();
        favoritesPanel.classList.add('open');
        historyPanel.classList.remove('open');
    });

    document.querySelectorAll('.close-panel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById(btn.dataset.panel).classList.remove('open');
        });
    });
});
let allRecipes = [];
let filteredRecipes = [];
let activeFilters = {
    search: '',
    category: 'all',
    portions: 'all',
    glutenFree: false,
    lactoseFree: false,
    quick: false,
    groupFriendly: false
};

// Laden der Rezepte
async function loadRecipes() {
    try {
        const response = await fetch('recipes.json');
        const data = await response.json();
        allRecipes = data.recipes;
        filteredRecipes = [...allRecipes];

        populateCategoryFilter();
        populatePortionsFilter();
        displayRecipes(filteredRecipes);
        updateFilterIndicator();
    } catch (error) {
        console.error('Fehler beim Laden der Rezepte:', error);
        document.getElementById('recipeGrid').innerHTML =
            '<p>Fehler beim Laden der Rezepte.</p>';
    }
}

// Kategorien-Filter befüllen
function populateCategoryFilter() {
    const categories = [...new Set(allRecipes.map(recipe => recipe.category))];
    const categoryFilter = document.getElementById('categoryFilter');

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Portions-Filter befüllen
function populatePortionsFilter() {
    const portions = [...new Set(allRecipes
        .filter(recipe => recipe.portions !== undefined && recipe.portions !== null)
        .map(recipe => recipe.portions))];

    const portionsFilter = document.getElementById('portionsFilter');

    portions.sort((a, b) => a - b).forEach(portion => {
        const option = document.createElement('option');
        option.value = portion;
        option.textContent = `${portion} Portion${portion === 1 ? '' : 'en'}`;
        portionsFilter.appendChild(option);
    });
}

// Hilfsfunktion: Gesamtzeit aus prepTime und cookTime berechnen (in Minuten)
function getTotalTime(recipe) {
    let totalMinutes = 0;

    if (recipe.prepTime) {
        const prepMatch = recipe.prepTime.match(/(\d+)/);
        if (prepMatch) {
            totalMinutes += parseInt(prepMatch[1]);
        }
    }

    if (recipe.cookTime) {
        const cookMatch = recipe.cookTime.match(/(\d+)/);
        if (cookMatch) {
            totalMinutes += parseInt(cookMatch[1]);
        }
    }

    return totalMinutes;
}

// Alle Filter anwenden
function applyAllFilters() {
    let filtered = [...allRecipes];

    // Suchfilter
    if (activeFilters.search) {
        const searchTerm = activeFilters.search.toLowerCase();
        filtered = filtered.filter(recipe =>
            recipe.name.toLowerCase().includes(searchTerm) ||
            recipe.ingredients.some(ingredient =>
                ingredient.toLowerCase().includes(searchTerm)
            ) ||
            recipe.category.toLowerCase().includes(searchTerm)
        );
    }

    // Glutenfrei-Filter
    if (activeFilters.glutenFree) {
        filtered = filtered.filter(recipe => recipe.glutenFree === true);
    }

    // Laktosefrei-Filter
    if (activeFilters.lactoseFree) {
        filtered = filtered.filter(recipe => recipe.lactoseFree === true);
    }

    // Kategorien-Filter
    if (activeFilters.category !== 'all') {
        filtered = filtered.filter(recipe => recipe.category === activeFilters.category);
    }

    // Portions-Filter
    if (activeFilters.portions !== 'all') {
        filtered = filtered.filter(recipe =>
            recipe.portions === parseInt(activeFilters.portions)
        );
    }

    // Schnell-Filter (max. 45 Min Gesamtzeit)
    if (activeFilters.quick) {
        filtered = filtered.filter(recipe => {
            const totalTime = getTotalTime(recipe);
            return totalTime > 0 && totalTime <= 45;
        });
    }

    // Gruppenfreundlich-Filter
    if (activeFilters.groupFriendly) {
        filtered = filtered.filter(recipe => recipe.groupFriendly === true);
    }

    filteredRecipes = filtered;
    displayRecipes(filtered);
    updateFilterIndicator();
}

// Filter-Anzeige aktualisieren
function updateFilterIndicator() {
    const totalRecipes = allRecipes.length;
    const visibleRecipes = filteredRecipes.length;

    // Entferne alte Indikatoren
    const oldIndicator = document.querySelector('.filter-indicator');
    if (oldIndicator) oldIndicator.remove();

    // Nur anzeigen wenn gefiltert wird
    if (visibleRecipes !== totalRecipes) {
        const indicator = document.createElement('span');
        indicator.className = 'filter-indicator';
        indicator.textContent = `${visibleRecipes} von ${totalRecipes}`;
        document.querySelector('.filters').appendChild(indicator);
    }
}

// Alle Filter zurücksetzen
function clearAllFilters() {
    activeFilters = {
        search: '',
        category: 'all',
        portions: 'all',
        glutenFree: false,
        lactoseFree: false,
        quick: false,
        groupFriendly: false
    };

    // UI zurücksetzen
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('portionsFilter').value = 'all';
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'all') {
            btn.classList.add('active');
        }
    });

    applyAllFilters();
}

// Rezepte anzeigen
function displayRecipes(recipes) {
    const grid = document.getElementById('recipeGrid');

    if (recipes.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <p style="font-size: 1.2rem; color: #666;">
                    🍰 Keine Rezepte gefunden.<br>
                    <small>Versuche andere Suchbegriffe oder setze die Filter zurück.</small>
                </p>
            </div>
        `;
        return;
    }

    grid.innerHTML = recipes.map(recipe => `
        <div class="recipe-card" onclick="openRecipeModal(${recipe.id})">
            <div class="recipe-image">
                ${recipe.image ?
        `<img src="${recipe.image}" alt="${recipe.name}">` :
        '📷 Kein Bild'}
            </div>
            <div class="recipe-content">
                <div class="recipe-title">${recipe.name}</div>
                <div class="recipe-meta">
                    <span class="category-tag">${recipe.category}</span>
                    ${recipe.glutenFree ? '<span class="gluten-tag">🌾 Glutenfrei</span>' : ''}
                    ${recipe.lactoseFree ? '<span class="lactose-tag">🥛 Laktosefrei</span>' : ''}
                </div>
                <p>${recipe.ingredients.length} Zutaten 
                   ${recipe.prepTime ? `• ${recipe.prepTime}` : ''}
                   ${recipe.portions ? `• ${recipe.portions} Portion${recipe.portions === 1 ? '' : 'en'}` : ''}
                </p>
            </div>
        </div>
    `).join('');
}

// Rezept-Modal öffnen
function openRecipeModal(recipeId) {
    const recipe = allRecipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="modal-header">
            <h2>${recipe.name}</h2>
            <div class="recipe-meta">
                <span class="category-tag">${recipe.category}</span>
                ${recipe.glutenFree ? '<span class="gluten-tag">🌾 Glutenfrei</span>' : ''}
                ${recipe.lactoseFree ? '<span class="lactose-tag">🥛 Laktosefrei</span>' : ''}
                ${recipe.groupFriendly ? '<span class="group-tag">👥 Gruppenfreundlich</span>' : ''}
                ${recipe.portions ? `
                <span class="portion-tag">
                    🍰 ${recipe.portions} Portion${recipe.portions === 1 ? '' : 'en'}
                </span>
                ` : ''}
            </div>
        </div>
        <div class="modal-body">
            ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.name}" class="modal-image">` : ''}
            
            ${recipe.youtube ? `<a href="${recipe.youtube}" target="_blank" class="youtube-link">📺 YouTube Video ansehen</a>` : ''}
            
            <div class="ingredients-list">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h3>🧁 Zutaten:</h3>
                    <button onclick="copyIngredients(${recipe.id})" class="copy-btn">
                        📋 Kopieren
                    </button>
                </div>
                <ul>
                    ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                </ul>
            </div>
            
            <div>
                <h3>👩‍🍳 Zubereitung:</h3>
                <p style="white-space: pre-line;">${recipe.instructions}</p>
            </div>
            
            ${recipe.notes && recipe.notes.length > 0 ? `
                <div class="notes">
                    <h3>🍯 Hinweise:</h3>
                    <ul>
                        ${recipe.notes.map(note => `<li>${note}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${recipe.prepTime || recipe.cookTime ? `
                <div class="times-box">
                    ⏰ <strong>Zeiten:</strong><br>
                    ${recipe.prepTime ? `Vorbereitung: ${recipe.prepTime}<br>` : ''}
                    ${recipe.cookTime ? `Kochzeit: ${recipe.cookTime}` : ''}
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('recipeModal').style.display = 'block';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadRecipes();

    // Suchfunktion
    document.getElementById('searchInput').addEventListener('input', (e) => {
        activeFilters.search = e.target.value;
        applyAllFilters();
    });

    // Filter-Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;

            if (filter === 'all') {
                activeFilters.glutenFree = false;
                activeFilters.lactoseFree = false;
                activeFilters.groupFriendly = false;
                activeFilters.quick = false;
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            } else {
                // Toggle Filter
                activeFilters[filter] = !activeFilters[filter];
                e.target.classList.toggle('active');

                // "Alle"-Button Zustand anpassen
                const anyToggleActive = activeFilters.glutenFree || activeFilters.lactoseFree || activeFilters.groupFriendly || activeFilters.quick;
                const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
                if (allBtn) {
                    if (anyToggleActive) {
                        allBtn.classList.remove('active');
                    } else {
                        allBtn.classList.add('active');
                    }
                }
            }

            applyAllFilters();
        });
    });

    // Kategorien-Filter
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        activeFilters.category = e.target.value;
        applyAllFilters();
    });

    // Portions-Filter
    document.getElementById('portionsFilter').addEventListener('change', (e) => {
        activeFilters.portions = e.target.value;
        applyAllFilters();
    });

    // Modal schließen
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('recipeModal').style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('recipeModal')) {
            document.getElementById('recipeModal').style.display = 'none';
        }
    });
});

// Zutaten kopieren Funktion
function copyIngredients(recipeId) {
    const recipe = allRecipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const ingredientsText = recipe.ingredients.join('\n');

    navigator.clipboard.writeText(ingredientsText).then(() => {
        // Visuelles Feedback
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '✨ Kopiert!';
        btn.style.background = '#2ed573';
        btn.style.borderColor = '#2ed573';
        btn.style.color = '#fff';

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Fehler beim Kopieren:', err);
        alert('Kopieren fehlgeschlagen');
    });
}

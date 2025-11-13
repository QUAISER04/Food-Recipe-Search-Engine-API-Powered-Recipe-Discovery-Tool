document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const categoryFilter = document.getElementById('category-filter');
    const recipeGrid = document.getElementById('recipe-grid');
    const resultsTitle = document.getElementById('results-title');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');

    const modal = document.getElementById('recipe-modal');
    const modalClose = document.getElementById('modal-close');
    const modalTitle = document.getElementById('modal-title');
    const modalImage = document.getElementById('modal-image');
    const modalCategory = document.getElementById('modal-category');
    const modalArea = document.getElementById('modal-area');
    const modalIngredients = document.getElementById('modal-ingredients');
    const modalInstructions = document.getElementById('modal-instructions');

    const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';
    const API_ENDPOINTS = {
        search: 'search.php?s=',
        categories: 'list.php?c=list',
        filterCategory: 'filter.php?c=',
        lookupById: 'lookup.php?i=',
    };

    async function searchRecipes() {
        showLoading(true);
        const query = searchInput.value.trim();
        const category = categoryFilter.value;

        let url;
        if (category) {
            resultsTitle.textContent = `Recipes in "${category}"`;
            url = `${API_BASE_URL}${API_ENDPOINTS.filterCategory}${encodeURIComponent(category)}`;
        } else if (query) {
            resultsTitle.textContent = `Search results for "${query}"`;
            url = `${API_BASE_URL}${API_ENDPOINTS.search}${encodeURIComponent(query)}`;
        } else {
            resultsTitle.textContent = 'Popular Recipes';
            url = `${API_BASE_URL}${API_ENDPOINTS.search}chicken`;
        }

        try {
            const response = await fetchWithRetry(url);
            const data = await response.json();
            displayRecipes(data.meals);
        } catch (error) {
            console.error('Error searching recipes:', error);
            showError(true);
        } finally {
            showLoading(false);
        }
    }

    async function getRecipeDetails(mealId) {
        showLoading(true);
        try {
            const url = `${API_BASE_URL}${API_ENDPOINTS.lookupById}${mealId}`;
            const response = await fetchWithRetry(url);
            const data = await response.json();
            if (data.meals && data.meals.length > 0) {
                openRecipeModal(data.meals[0]);
            } else {
                throw new Error('Recipe not found.');
            }
        } catch (error) {
            console.error('Error fetching recipe details:', error);
            alert('Could not load recipe details. Please try again.');
        } finally {
            showLoading(false);
        }
    }

    async function populateCategories() {
        try {
            const url = `${API_BASE_URL}${API_ENDPOINTS.categories}`;
            const response = await fetchWithRetry(url);
            const data = await response.json();

            if (data.meals) {
                data.meals.forEach((category) => {
                    const option = document.createElement('option');
                    option.value = category.strCategory;
                    option.textContent = category.strCategory;
                    categoryFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error populating categories:', error);
        }
    }

    async function fetchWithRetry(url, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i += 1) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response;
            } catch (error) {
                console.warn(`Fetch attempt ${i + 1} failed for ${url}. Retrying in ${delay / 1000}s...`);
                if (i === retries - 1) throw error;
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
        throw new Error('Failed to fetch after multiple retries');
    }

    function displayRecipes(meals) {
        recipeGrid.innerHTML = '';
        if (!meals) {
            showError(true);
            return;
        }

        showError(false);
        meals.forEach((meal) => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 cursor-pointer';
            card.innerHTML = `
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="w-full h-48 object-cover">
                <div class="p-5">
                    <h3 class="text-xl font-semibold text-gray-800 truncate">${meal.strMeal}</h3>
                    <button class="mt-4 text-orange-500 font-medium hover:text-orange-600">
                        View Recipe <i class="fas fa-arrow-right text-xs ml-1"></i>
                    </button>
                </div>
            `;
            card.addEventListener('click', () => getRecipeDetails(meal.idMeal));
            recipeGrid.appendChild(card);
        });
    }

    function openRecipeModal(meal) {
        modalTitle.textContent = meal.strMeal;
        modalImage.src = meal.strMealThumb;
        modalCategory.textContent = meal.strCategory;
        modalArea.textContent = meal.strArea;
        modalInstructions.textContent = meal.strInstructions;

        modalIngredients.innerHTML = '';
        for (let i = 1; i <= 20; i += 1) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];

            if (ingredient && ingredient.trim() !== '') {
                const li = document.createElement('li');
                li.textContent = `${measure} - ${ingredient}`;
                modalIngredients.appendChild(li);
            }
        }

        modal.classList.remove('hidden');
    }

    function closeRecipeModal() {
        modal.classList.add('hidden');
    }

    function showLoading(isLoading) {
        loader.classList.toggle('hidden', !isLoading);
        recipeGrid.classList.toggle('hidden', isLoading);
        errorMessage.classList.toggle('hidden', true);
    }

    function showError(isError) {
        errorMessage.classList.toggle('hidden', !isError);
        recipeGrid.classList.toggle('hidden', isError);
    }

    searchButton.addEventListener('click', searchRecipes);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchRecipes();
        }
    });
    categoryFilter.addEventListener('change', () => {
        searchInput.value = '';
        searchRecipes();
    });

    modalClose.addEventListener('click', closeRecipeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeRecipeModal();
        }
    });

    function init() {
        populateCategories();
        searchRecipes();
    }

    init();
});

